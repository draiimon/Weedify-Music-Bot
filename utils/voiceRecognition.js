const { joinVoiceChannel, EndBehaviorType, createAudioPlayer, createAudioResource, StreamType, AudioPlayerStatus } = require('@discordjs/voice');
const { OpusEncoder } = require('@discordjs/opus');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class VoiceRecognition {
    constructor(client) {
        this.client = client;
        this.activeListeners = new Map(); // guildId -> voice connection
        this.groqClient = null;
        this.speechMethod = process.env.SPEECH_METHOD || 'groq';

        // Initialize Groq client if API key is available
        if (process.env.GROQ_API_KEY) {
            this.groqClient = new Groq({
                apiKey: process.env.GROQ_API_KEY
            });
            console.log('✅ Groq Whisper API initialized');
        } else {
            console.warn('⚠️ GROQ_API_KEY not found. Voice recognition will not work.');
        }

        this.language = process.env.VOICE_LANGUAGE || 'en';
        this.tempDir = path.join(__dirname, '..', 'temp_audio');

        // Create temp directory if it doesn't exist
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async startListening(guild, voiceChannel, textChannel) {
        try {
            const guildId = guild.id;

            // Check if already listening
            if (this.activeListeners.has(guildId)) {
                return { success: false, message: 'Already listening in this server!' };
            }

            // Join voice channel - MUST BE UNMUTED TO SPEAK
            const voiceConnection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guildId,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false, // Changed to FALSE so bot can speak!
            });

            // Store connection info
            this.activeListeners.set(guildId, {
                voiceConnection,
                textChannel,
                voiceChannel
            });

            // Start listening for speech
            this.setupSpeechRecognition(guildId, voiceConnection, textChannel);

            // DOUBLE CHECK: Force undeafen via Discord.js to be 100% sure
            const discordGuild = this.client.guilds.cache.get(guildId);
            if (discordGuild && discordGuild.members.me && discordGuild.members.me.voice) {
                setTimeout(() => {
                    try {
                        discordGuild.members.me.voice.setDeaf(false).catch(err => console.error(`Failed to force undeafen (Voice): ${err.message}`));
                    } catch (e) { console.error('Force undeafen error (Voice):', e); }
                }, 2000);
            }

            console.log(`🎤 Started listening in ${guild.name} (${voiceChannel.name})`);
            return { success: true, message: `Now listening for voice requests in ${voiceChannel.name}!\nSay "play [song name]" to request music.` };

        } catch (error) {
            console.error('Error starting voice listener:', error);
            return { success: false, message: 'Failed to start listening: ' + error.message };
        }
    }

    setupSpeechRecognition(guildId, voiceConnection, textChannel) {
        const receiver = voiceConnection.receiver;

        receiver.speaking.on('start', async (userId) => {
            try {
                const user = this.client.users.cache.get(userId);
                if (!user || user.bot) return; // Ignore bots

                console.log(`🎤 ${user.username} started speaking`);

                const audioStream = receiver.subscribe(userId, {
                    end: {
                        behavior: EndBehaviorType.AfterSilence,
                        duration: 1000, // 1 second of silence
                    },
                });

                const encoder = new OpusEncoder(48000, 2);
                let buffer = [];

                audioStream.on('data', chunk => {
                    try {
                        buffer.push(encoder.decode(chunk));
                    } catch (err) {
                        console.error('Audio decode error:', err.message);
                    }
                });

                audioStream.once('end', async () => {
                    try {
                        buffer = Buffer.concat(buffer);
                        const duration = buffer.length / 48000 / 4;

                        console.log(`Audio duration: ${duration.toFixed(2)}s`);

                        // Skip too short or too long clips
                        if (duration < 1.0 || duration > 19) {
                            console.log('Audio too short/long, skipping');
                            return;
                        }

                        // Transcribe the audio
                        const transcription = await this.transcribe(buffer, guildId);

                        if (transcription && transcription.trim().length > 0) {
                            console.log(`Transcribed: "${transcription}"`);

                            // Send transcription to text channel
                            await textChannel.send(`🎤 **${user.username}**: ${transcription}`);

                            // Process as song request
                            await this.processSongRequest(transcription, guildId, textChannel, user);
                        }
                    } catch (error) {
                        console.error('Error processing audio:', error.message);
                    }
                });

            } catch (error) {
                console.error('Error in speaking handler:', error.message);
            }
        });
    }

    async transcribe(buffer, guildId) {
        try {
            if (this.speechMethod === 'groq' && this.groqClient) {
                return await this.transcribeGroq(buffer);
            } else {
                console.error('No transcription method available');
                return null;
            }
        } catch (error) {
            console.error('Transcription error:', error.message);
            return null;
        }
    }

    async transcribeGroq(buffer) {
        try {
            // Save buffer as temporary audio file
            const tempFilePath = path.join(this.tempDir, `audio_${Date.now()}.raw`);
            fs.writeFileSync(tempFilePath, buffer);

            console.log('Sending to Groq Whisper API...');

            // Create a readable stream from the file
            const fileStream = fs.createReadStream(tempFilePath);

            // Send to Groq Whisper API
            const transcription = await this.groqClient.audio.transcriptions.create({
                file: fileStream,
                model: 'whisper-large-v3',
                language: this.language,
                response_format: 'text',
                temperature: 0
            });

            // Clean up temp file
            fs.unlinkSync(tempFilePath);

            return transcription || '';

        } catch (error) {
            console.error('Groq transcription error:', error.message);
            return null;
        }
    }

    async processSongRequest(text, guildId, textChannel, user) {
        try {
            // Check for song request keywords
            const lowerText = text.toLowerCase();
            let songQuery = null;

            // STRICT ACTIVATION: Must start with "play", "tugtugin", or "pakinggan"
            if (lowerText.startsWith('play ')) {
                songQuery = text.substring(5).trim();
            }
            else if (lowerText.startsWith('tugtugin ') || lowerText.startsWith('tugtog ')) {
                songQuery = text.substring(text.indexOf(' ') + 1).trim();
            }
            else if (lowerText.startsWith('pakinggan ')) {
                songQuery = text.replace(/pakinggan/i, '').trim();
            }

            if (songQuery && songQuery.length > 0) {
                console.log(`🎵 Song request detected: "${songQuery}"`);

                // Get the player
                const player = this.client.riffy.players.get(guildId);

                if (player && this.client.playerHandler) {
                    // Use existing player handler to play the song
                    const result = await this.client.playerHandler.playSong(player, songQuery, user);

                    if (result.type === 'track') {
                        await textChannel.send(`✅ **Weedify:** Ayt bet, queuing up **${result.track.info.title}** for ya!`);
                    } else if (result.type === 'playlist') {
                        await textChannel.send(`✅ **Weedify:** Playlist secured! Loaded **${result.name}** with ${result.tracks} tracks.`);
                    } else {
                        await textChannel.send(`❌ **Weedify:** Yo fam, couldn't find anything for "${songQuery}". Try again?`);
                    }
                } else {
                    await textChannel.send(`❌ **Weedify:** I ain't in a voice channel yet. Hit me with that \`w!join\` first!`);
                }
            } else {
                // --- EXPANDED VOICE COMMANDS ---
                const commandText = lowerText.trim();
                const player = this.client.riffy.players.get(guildId);

                if (player) {
                    // SKIP
                    if (['skip', 'next', 'lipat'].some(cmd => commandText.includes(cmd))) {
                        player.stop();
                        return textChannel.send(`⏭️ **Weedify:** Skipped that track!`);
                    }
                    // SHUFFLE
                    if (['shuffle', 'mix', 'halo'].some(cmd => commandText.includes(cmd))) {
                        player.queue.shuffle();
                        return textChannel.send(`🔀 **Weedify:** Shuffled the playlist, let's mix it up!`);
                    }
                    // PAUSE
                    if (['pause', 'time out', 'hinto muna'].some(cmd => commandText.includes(cmd))) {
                        player.pause(true);
                        return textChannel.send(`⏸️ **Weedify:** Paused. Holler when you ready.`);
                    }
                    // RESUME
                    if (['resume', 'tuloy', 'continue'].some(cmd => commandText.includes(cmd))) {
                        player.pause(false);
                        return textChannel.send(`▶️ **Weedify:** We back in action!`);
                    }
                    // STOP / LEAVE
                    if (['stop music', 'hinto', 'stop playing'].some(cmd => commandText === cmd)) { // Strict match for stop
                        player.destroy();
                        return textChannel.send(`Tk **Weedify:** Aight, I'm out. Peace!`);
                    }
                    // LOOP
                    if (['loop', 'repeat', 'ulit'].some(cmd => commandText.includes(cmd))) {
                        const currentLoop = player.loop;
                        // Toggle loop (Track -> Queue -> Off) - Simplified to Track/Off for voice
                        if (currentLoop === 'none') {
                            player.setLoop('track');
                            return textChannel.send(`Tk **Weedify:** Looping this track!`);
                        } else {
                            player.setLoop('none');
                            return textChannel.send(`Tk **Weedify:** Loop off.`);
                        }
                    }
                }

                // If it's NOT a song request OR a command, generate an AI response
                console.log(`💬 Conversational input detected: "${text}"`);
                await this.generateAIResponse(text, textChannel, user, guildId);
            }

        } catch (error) {
            console.error('Error processing request:', error.message);
            await textChannel.send(`❌ Error processing request: ${error.message}`);
        }
    }

    async generateAIResponse(text, textChannel, user, guildId) {
        if (!this.groqClient) return;

        try {
            const prompt = `
            You are "Weedify", a cool, laid-back, and hype AI assistant for a music bot. 
            Language: TAGALOG / TAGLISH (Strict).
            Your vibe is energetic, use Filipino slang (par, tol, omsim). (Young Stunna Attitude).
            
            Current User: ${user.username}
            User Input: "${text}"
            Developer: Mark Andrei Castillo.
            
            Respond in Tagalog/Taglish. Keep it short (under 2 sentences). 
            Do NOT act like a robot. Be a homie.
            If they ask how to play music, tell them: "Sabihin mo lang 'Play [song name]' par."
            `;

            const completion = await this.groqClient.chat.completions.create({
                messages: [
                    { role: "system", content: "You are Weedify, a Tagalog speaking music bot assistant." },
                    { role: "user", content: prompt }
                ],
                model: "openai/gpt-oss-120b", // User requested specific model
                temperature: 0.7,
                max_tokens: 150,
            });

            const aiResponse = completion.choices[0]?.message?.content || "Yo, I didn't catch that.";

            // Send Text
            await textChannel.send(`🗣️ **Weedify:** ${aiResponse}`);

            // SPEAK RESPONSE (TTS)
            if (guildId) {
                await this.speakResponse(aiResponse, guildId);
            }

        } catch (error) {
            console.error('Error generating AI response:', error);
        }
    }

    async speakResponse(text, guildId) {
        try {
            const listener = this.activeListeners.get(guildId);
            if (!listener || !listener.voiceConnection) return;

            const connection = listener.voiceConnection;
            const audioPath = path.join(this.tempDir, `voice_reply_${Date.now()}.mp3`);
            const pythonScriptPath = path.join(__dirname, '..', 'python', 'tts_gen.py');
            const safeText = text.replace(/"/g, '\\"');

            // 1. Generate Audio file using spawn (Safer than exec)
            const { spawn } = require('child_process');

            await new Promise((resolve, reject) => {
                const child = spawn('python3', [pythonScriptPath, text, audioPath]);

                let stderrData = '';

                child.stderr.on('data', (data) => {
                    stderrData += data.toString();
                });

                child.on('close', (code) => {
                    if (code !== 0) {
                        console.error(`TTS Process exited with code ${code}`);
                        console.error(`TTS Stderr: ${stderrData}`);
                        reject(new Error(`TTS failed with code ${code}`));
                    } else {
                        resolve();
                    }
                });

                child.on('error', (err) => {
                    console.error('Failed to start TTS process:', err);
                    reject(err);
                });
            });

            // 2. Play Audio via Discord Voice
            const player = createAudioPlayer();
            const resource = createAudioResource(audioPath, { inputType: StreamType.Arbitrary });

            // Subscribe logic
            const subscription = connection.subscribe(player);

            if (subscription) {
                player.play(resource);
                console.log(`🗣️ Speaking: "${text}"`);
            }

            // Cleanup
            player.on(AudioPlayerStatus.Idle, () => {
                if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
            });

            player.on('error', err => {
                console.error('Audio Player Error:', err);
                if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
            });

        } catch (error) {
            console.error('Speak Response Error:', error);
        }
    }

    stopListening(guildId) {
        try {
            const listener = this.activeListeners.get(guildId);

            if (!listener) {
                return { success: false, message: 'Not listening in this server!' };
            }

            // Destroy voice connection
            listener.voiceConnection.destroy();
            this.activeListeners.delete(guildId);

            console.log(`🎤 Stopped listening in guild ${guildId}`);
            return { success: true, message: 'Stopped listening for voice requests.' };

        } catch (error) {
            console.error('Error stopping voice listener:', error);
            return { success: false, message: 'Failed to stop listening: ' + error.message };
        }
    }

    isListening(guildId) {
        return this.activeListeners.has(guildId);
    }

    getStatus(guildId) {
        const listener = this.activeListeners.get(guildId);
        if (listener) {
            return {
                listening: true,
                channel: listener.voiceChannel.name,
                method: this.speechMethod,
                language: this.language
            };
        }
        return { listening: false };
    }
}

module.exports = VoiceRecognition;

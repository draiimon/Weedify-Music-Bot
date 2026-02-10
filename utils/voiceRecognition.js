const { joinVoiceChannel, EndBehaviorType } = require('@discordjs/voice');
const { OpusEncoder } = require('@discordjs/opus');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

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

            // Join voice channel
            const voiceConnection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guildId,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: true,
            });

            // Store connection info
            this.activeListeners.set(guildId, {
                voiceConnection,
                textChannel,
                voiceChannel
            });

            // Start listening for speech
            this.setupSpeechRecognition(guildId, voiceConnection, textChannel);

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
                        await textChannel.send(`✅ **Young Stunna:** Ayt bet, queuing up **${result.track.info.title}** for ya!`);
                    } else if (result.type === 'playlist') {
                        await textChannel.send(`✅ **Young Stunna:** Playlist secured! Loaded **${result.name}** with ${result.tracks} tracks.`);
                    } else {
                        await textChannel.send(`❌ **Young Stunna:** Yo fam, couldn't find anything for "${songQuery}". Try again?`);
                    }
                } else {
                    await textChannel.send(`❌ **Young Stunna:** I ain't in a voice channel yet. Hit me with that \`w!join\` first!`);
                }
            } else {
                // --- EXPANDED VOICE COMMANDS ---
                const commandText = lowerText.trim();
                const player = this.client.riffy.players.get(guildId);

                if (player) {
                    // SKIP
                    if (['skip', 'next', 'lipat'].some(cmd => commandText.includes(cmd))) {
                        player.stop();
                        return textChannel.send(`⏭️ **Young Stunna:** Skipped that track!`);
                    }
                    // SHUFFLE
                    if (['shuffle', 'mix', 'halo'].some(cmd => commandText.includes(cmd))) {
                        player.queue.shuffle();
                        return textChannel.send(`🔀 **Young Stunna:** Shuffled the playlist, let's mix it up!`);
                    }
                    // PAUSE
                    if (['pause', 'time out', 'hinto muna'].some(cmd => commandText.includes(cmd))) {
                        player.pause(true);
                        return textChannel.send(`⏸️ **Young Stunna:** Paused. Holler when you ready.`);
                    }
                    // RESUME
                    if (['resume', 'tuloy', 'continue'].some(cmd => commandText.includes(cmd))) {
                        player.pause(false);
                        return textChannel.send(`▶️ **Young Stunna:** We back in action!`);
                    }
                    // STOP / LEAVE
                    if (['stop music', 'hinto', 'stop playing'].some(cmd => commandText === cmd)) { // Strict match for stop
                        player.destroy();
                        return textChannel.send(`Tk **Young Stunna:** Aight, I'm out. Peace!`);
                    }
                    // LOOP
                    if (['loop', 'repeat', 'ulit'].some(cmd => commandText.includes(cmd))) {
                        const currentLoop = player.loop;
                        // Toggle loop (Track -> Queue -> Off) - Simplified to Track/Off for voice
                        if (currentLoop === 'none') {
                            player.setLoop('track');
                            return textChannel.send(`Tk **Young Stunna:** Looping this track!`);
                        } else {
                            player.setLoop('none');
                            return textChannel.send(`Tk **Young Stunna:** Loop off.`);
                        }
                    }
                }

                // If it's NOT a song request OR a command, generate an AI response
                console.log(`💬 Conversational input detected: "${text}"`);
                await this.generateAIResponse(text, textChannel, user);
            }

        } catch (error) {
            console.error('Error processing request:', error.message);
            await textChannel.send(`❌ Error processing request: ${error.message}`);
        }
    }

    async generateAIResponse(text, textChannel, user) {
        if (!this.groqClient) return;

        try {
            const prompt = `
            You are "Young Stunna", a cool, laid-back, and hype AI assistant for a music bot. 
            Language: TAGALOG / TAGLISH (Strict).
            Your vibe is energetic, use Filipino slang (par, tol, omsim).
            
            Current User: ${user.username}
            User Input: "${text}"
            
            Respond in Tagalog/Taglish. Keep it short (under 2 sentences). 
            Do NOT act like a robot. Be a homie.
            If they ask how to play music, tell them: "Sabihin mo lang 'Play [song name]' par."
            `;

            const completion = await this.groqClient.chat.completions.create({
                messages: [
                    { role: "system", content: "You are Young Stunna, a Tagalog speaking music bot assistant." },
                    { role: "user", content: prompt }
                ],
                model: "openai/gpt-oss-120b", // User requested specific model
                temperature: 0.7,
                max_tokens: 150,
            });

            const aiResponse = completion.choices[0]?.message?.content || "Yo, I didn't catch that.";

            await textChannel.send(`🗣️ **Young Stunna:** ${aiResponse}`);

        } catch (error) {
            console.error('Error generating AI response:', error);
            // Fallback generic response if AI fails
            // await textChannel.send(`🗣️ **Young Stunna:** My bad, I spaced out. What was that?`);
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

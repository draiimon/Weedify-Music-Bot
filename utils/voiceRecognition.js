const { joinVoiceChannel, EndBehaviorType, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const prism = require('prism-media');
const { createWriteStream, unlinkSync, existsSync, mkdirSync } = require('fs');
const { Readable } = require('stream');
const path = require('path');
const Groq = require('groq-sdk');

class VoiceRecognition {
    constructor(client) {
        this.client = client;
        this.activeListeners = new Map(); // guildId => { connection, isProcessing, audioData }
        this.groq = null;

        if (process.env.GROQ_API_KEY) {
            this.groq = new Groq({
                apiKey: process.env.GROQ_API_KEY
            });
            console.log('✅ Groq client initialized for voice recognition');
        } else {
            console.warn('⚠️ GROQ_API_KEY not found. Voice recognition will not work.');
        }

        // Ensure temp directory exists
        if (!existsSync('./temp_audio')) {
            mkdirSync('./temp_audio', { recursive: true });
        }
    }

    async startListening(guild, voiceChannel, textChannel) {
        try {
            if (!this.groq) {
                return { success: false, message: '❌ Groq API not configured' };
            }

            const guildId = guild.id;

            // Join voice channel
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guildId,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: false, // CRITICAL: Must be false to receive audio
                selfMute: false
            });

            console.log(`🔊 Joined voice channel: ${voiceChannel.name}`);

            // Force undeafen after 2 seconds
            const discordGuild = this.client.guilds.cache.get(guildId);
            if (discordGuild && discordGuild.members.me && discordGuild.members.me.voice) {
                setTimeout(() => {
                    try {
                        discordGuild.members.me.voice.setDeaf(false).catch(err => console.error(`Failed to force undeafen (Voice): ${err.message}`));
                        console.log(`🔓 Force undeafened in ${voiceChannel.name}`);
                    } catch (e) { console.error('Force undeafen error (Voice):', e); }
                }, 2000);
            }

            // Set up receiver - Subscribe to ALL users in the voice channel
            const receiver = connection.receiver;

            // Subscribe to each user currently in the voice channel
            voiceChannel.members.forEach((member) => {
                if (member.user.bot) return; // Skip bots

                console.log(`👂 Subscribed to ${member.user.username}`);

                const audioStream = receiver.subscribe(member.id, {
                    end: {
                        behavior: EndBehaviorType.AfterSilence,
                        duration: 1000 // 1 second of silence ends stream
                    }
                });

                // Process audio when it arrives
                audioStream.on('readable', () => {
                    console.log(`🎤 ${member.user.username} is speaking`);
                    this.processAudioStream(audioStream, guildId, member.id, textChannel);
                });

                audioStream.on('error', (error) => {
                    console.error(`Audio stream error for ${member.user.username}:`, error);
                });
            });

            this.activeListeners.set(guildId, { connection, textChannel });

            console.log(`🎤 Started listening in ${guild.name} (${voiceChannel.name})`);
            return { success: true, message: `Now listening for voice requests in ${voiceChannel.name}!\\nSay \"play [song name]\" to request music.` };

        } catch (error) {
            console.error('Error starting voice listener:', error);
            return { success: false, message: 'Failed to start listening: ' + error.message };
        }
    }

    async processAudioStream(opusStream, guildId, userId, textChannel) {
        try {
            const listener = this.activeListeners.get(guildId);
            if (!listener) return;

            // Prevent overlapping processing
            if (listener.isProcessing) {
                console.log('⏭️ Skipping overlapping audio processing');
                return;
            }

            listener.isProcessing = true;

            // Convert Opus to PCM
            const decoder = new prism.opus.Decoder({
                frameSize: 960,
                channels: 2,
                rate: 48000
            });

            // Collect PCM data
            const audioChunks = [];

            opusStream
                .pipe(decoder)
                .on('data', (chunk) => {
                    audioChunks.push(chunk);
                })
                .on('end', async () => {
                    try {
                        if (audioChunks.length === 0) {
                            console.log('⏭️ No audio data captured');
                            listener.isProcessing = false;
                            return;
                        }

                        // Combine all chunks
                        const audioBuffer = Buffer.concat(audioChunks);

                        // Save to WAV file
                        const timestamp = Date.now();
                        const wavPath = path.join('./temp_audio', `recording_${guildId}_${timestamp}.wav`);

                        // Write WAV file
                        await this.saveAsWav(audioBuffer, wavPath);

                        console.log(`💾 Saved audio: ${wavPath} (${audioBuffer.length} bytes)`);

                        // Transcribe with Groq
                        await this.transcribeAndProcess(wavPath, guildId, userId, textChannel);

                    } catch (error) {
                        console.error('Error processing audio end:', error);
                    } finally {
                        listener.isProcessing = false;
                    }
                })
                .on('error', (error) => {
                    console.error('Error in audio stream:', error);
                    listener.isProcessing = false;
                });

        } catch (error) {
            console.error('Error in processAudioStream:', error);
            const listener = this.activeListeners.get(guildId);
            if (listener) listener.isProcessing = false;
        }
    }

    async saveAsWav(pcmBuffer, outputPath) {
        const fs = require('fs');
        const wav = require('wav');

        const writer = new wav.Writer({
            channels: 2,
            sampleRate: 48000,
            bitDepth: 16
        });

        writer.pipe(fs.createWriteStream(outputPath));
        writer.write(pcmBuffer);
        writer.end();

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    }

    async transcribeAndProcess(audioPath, guildId, userId, textChannel) {
        try {
            if (!this.groq) {
                console.error('❌ Groq client not initialized');
                return;
            }

            console.log(`🎤 Transcribing audio for guild ${guildId}...`);

            const fs = require('fs');
            const fileBuffer = fs.readFileSync(audioPath);

            const transcription = await this.groq.audio.transcriptions.create({
                file: fileBuffer,
                model: 'whisper-large-v3',
                response_format: 'json',
                temperature: 0
            });

            const text = transcription.text?.trim();
            console.log(`📝 Transcription: "${text}"`);

            // Clean up audio file
            if (existsSync(audioPath)) {
                unlinkSync(audioPath);
            }

            if (!text || text.length < 2) {
                console.log('⏭️ Transcription too short, ignoring');
                return;
            }

            // Process the command
            await this.handleVoiceCommand(text, guildId, userId, textChannel);

        } catch (error) {
            console.error('❌ Transcription error:', error);
            // Clean up on error
            if (existsSync(audioPath)) {
                unlinkSync(audioPath);
            }
        }
    }

    async handleVoiceCommand(text, guildId, userId, textChannel) {
        const lowerText = text.toLowerCase();

        // Check for "play" command
        if (lowerText.includes('play') || lowerText.includes('tugtugin') || lowerText.includes('patugtog')) {
            // Extract song name
            let songName = text
                .replace(/play/gi, '')
                .replace(/tugtugin/gi, '')
                .replace(/patugtog/gi, '')
                .trim();

            if (songName.length > 0) {
                console.log(`🎵 Voice request: ${songName}`);

                // Speak confirmation
                await this.speak(guildId, `Sige, tugtugin ko ang ${songName}`);

                // Get the play command
                const playCommand = this.client.messageCommands?.get('play');
                if (playCommand) {
                    // Create a pseudo-message object
                    const guild = this.client.guilds.cache.get(guildId);
                    const member = guild.members.cache.get(userId);
                    const voiceChannel = member?.voice?.channel;

                    if (voiceChannel) {
                        try {
                            await playCommand.execute({
                                guild,
                                member,
                                channel: textChannel,
                                reply: (msg) => textChannel.send(msg)
                            }, [songName], this.client);
                        } catch (error) {
                            console.error('Error executing play command:', error);
                            await this.speak(guildId, `Sorry, di ko mahanap yung ${songName}`);
                        }
                    }
                }
            }
        }
    }

    async speak(guildId, text) {
        try {
            const listener = this.activeListeners.get(guildId);
            if (!listener) {
                console.warn('⚠️ No active voice connection for TTS');
                return;
            }

            const { connection } = listener;

            // Generate TTS
            const audioPath = path.join('./temp_audio', `tts_${Date.now()}.mp3`);
            const pythonScript = path.join(__dirname, '..', 'python', 'tts_gen.py');

            const { spawn } = require('child_process');

            await new Promise((resolve, reject) => {
                const child = spawn('python3', [pythonScript, text, audioPath]);

                child.on('close', (code) => {
                    if (code !== 0) {
                        reject(new Error(`TTS failed with code ${code}`));
                    } else {
                        resolve();
                    }
                });

                child.on('error', reject);
            });

            // Play audio
            const player = createAudioPlayer();
            const resource = createAudioResource(audioPath, { inputType: StreamType.Arbitrary });

            connection.subscribe(player);
            player.play(resource);

            console.log(`🗣️ Speaking: "${text}"`);

            player.on(AudioPlayerStatus.Idle, () => {
                if (existsSync(audioPath)) {
                    unlinkSync(audioPath);
                }
            });

        } catch (error) {
            console.error('TTS Error:', error);
        }
    }

    stopListening(guildId) {
        const listener = this.activeListeners.get(guildId);
        if (!listener) {
            return { success: false, message: '❌ Not currently listening in this server' };
        }

        listener.connection.destroy();
        this.activeListeners.delete(guildId);

        return { success: true, message: '🔇 Stopped listening for voice commands' };
    }

    isListening(guildId) {
        return this.activeListeners.has(guildId);
    }

    getStatus(guildId) {
        return this.isListening(guildId) ? '🎤 Listening' : '🔇 Not listening';
    }
}

module.exports = VoiceRecognition;

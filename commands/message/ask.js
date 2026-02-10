const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { createAudioResource, createAudioPlayer, AudioPlayerStatus, StreamType, joinVoiceChannel } = require('@discordjs/voice');

const Groq = require('groq-sdk');
// If EdgeTTS is not available as 'edge-tts-ga', check if 'edge-tts' worked.
// Actually, let's use a simpler approach if the package is tricky.
// Let's create a python script wrapper if needed. But let's try to assume we can use a library.
// Wait, I installed 'edge-tts' via npm. Let's see if it works. If not, I'll fallback to python.
// 'edge-tts' package on npm is usually a wrapper around the python CLI or a port.
// Let's use 'node-edge-tts' or similar if available.
// Actually, the user's stack said `edge-tts` (Python).
// I will create a python script for TTS generation to be safe and call it from Node.

module.exports = {
    name: "ask",
    description: "Ask Young Stunna a question and get a voice response",
    execute: async (message, args, client) => {
        try {
            if (!args.length) {
                return message.reply("❌ **Weedify:** Yo, you gotta ask me somethin'!");
            }

            const question = args.join(' ');
            const voiceChannel = message.member.voice.channel;

            if (!voiceChannel) {
                return message.reply("❌ **Weedify:** Hoff into a voice channel first, fam!");
            }

            // Join voice channel if not already connected
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });

            // Ack
            const thinkingMsg = await message.reply("🧠 **Weedify:** Thinking about that...");

            // --- 1. Generate AI Response using Groq ---
            const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

            const systemPrompt = `
            You are "Weedify", an AI assistant for the Weedify Music Bot.
            Your persona: Cool, energetic, slang-heavy, friendly, helpful (Young Stunna Vibes).
            Language: TAGALOG / TAGLISH (Required).
            
            System Info:
            - Bot Name: Weedify Music Bot
            - Prefix: w!
            - Commands: w!play, w!skip, w!stop, w!ask, w!listen, w!lstop
            - Developer: Mark Andrei Castillo.
            
            Task: Answer the user's question accurately but in your persona (Tagalog/Taglish).
            Keep it concise (under 3 sentences) for voice playback.
            `;

            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: question }
                ],
                model: "openai/gpt-oss-120b", // User requested specific model
                temperature: 0.7,
            });

            const answer = completion.choices[0]?.message?.content || "My bad, I blanked out.";

            // Update text response
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(`❓ Question: ${question}`)
                .setDescription(`🗣️ **Weedify:** ${answer}`)
                .setFooter({ text: 'Weedify • Powered by Groq AI' }); // Custom Footer

            await thinkingMsg.edit({ content: null, embeds: [embed] });

            // --- 2. Generate Audio using Python script (edge-tts) ---
            const audioPath = path.join(__dirname, '..', '..', 'temp_audio', `response_${Date.now()}.mp3`);
            // Make sure dir exists
            if (!fs.existsSync(path.dirname(audioPath))) {
                fs.mkdirSync(path.dirname(audioPath), { recursive: true });
            }

            const pythonScriptPath = path.join(__dirname, '..', '..', 'python', 'tts_gen.py');

            // Execute Python script: python3 tts_gen.py "text" "output_file"
            // Start process
            // USE PYTHON3 with spawn for safety
            const { spawn } = require('child_process');

            const child = spawn('python3', [pythonScriptPath, answer, audioPath]);

            child.stdout.on('data', (data) => console.log(`TTS STDOUT: ${data}`));
            child.stderr.on('data', (data) => console.error(`TTS STDERR: ${data}`));

            child.on('close', (code) => {
                if (code !== 0) {
                    return message.channel.send("❌ **Weedify:** Voice box broke, check console logs.");
                }

                // Play Audio
                const player = createAudioPlayer();
                const resource = createAudioResource(audioPath, { inputType: StreamType.Arbitrary });

                const subscription = connection.subscribe(player);
                if (subscription) {
                    player.play(resource);
                } else {
                    console.error('Failed to subscribe to connection');
                }

                player.on(AudioPlayerStatus.Idle, () => {
                    // Cleanup audio file
                    try { fs.unlinkSync(audioPath); } catch (e) { }
                });

                player.on('error', error => {
                    console.error('Audio Player Error:', error);
                    try { fs.unlinkSync(audioPath); } catch (e) { }
                });
            });

        } catch (error) {
            console.error('w!ask error:', error);
            message.reply("❌ An error occurred.");
        }
    }
};

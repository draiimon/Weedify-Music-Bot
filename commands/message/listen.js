const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'listen',
    aliases: ['makinig', 'dinig', 'pakinggan', 'unlisten', 'stoplisten'],
    description: 'Enable or disable voice recognition for song requests',
    usage: 'w!listen or w!unlisten',
    category: 'voice',

    async execute(message, args, client) {
        try {
            const isStopCommand = ['unlisten', 'stoplisten'].includes(message.content.toLowerCase().replace(client.config?.bot?.prefix || 'w!', ''));

            // Check if user is in a voice channel
            if (!message.member.voice.channel && !isStopCommand) {
                return message.reply('❌ You need to be in a voice channel to use this command!');
            }

            // Initialize voice recognition if not already done
            if (!client.voiceRecognition) {
                const VoiceRecognition = require('../../utils/voiceRecognition');
                client.voiceRecognition = new VoiceRecognition(client);
            }

            const guildId = message.guild.id;

            // Handle stop/unlisten
            if (isStopCommand) {
                const result = client.voiceRecognition.stopListening(guildId);

                const embed = new EmbedBuilder()
                    .setColor(result.success ? 0xFF6B6B : 0xFF0000)
                    .setTitle(result.success ? '🔇 Voice Listening Disabled' : '❌ Error')
                    .setDescription(result.message)
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            // Handle start listening
            const voiceChannel = message.member.voice.channel;
            const textChannel = message.channel;

            const result = await client.voiceRecognition.startListening(
                message.guild,
                voiceChannel,
                textChannel
            );

            const embed = new EmbedBuilder()
                .setColor(result.success ? 0x00FF00 : 0xFF0000)
                .setTitle(result.success ? '🎤 Voice Listening Enabled' : '❌ Error')
                .setDescription(result.message)
                .setFooter({ text: 'Powered by Groq Whisper API' })
                .setTimestamp();

            if (result.success) {
                embed.addFields(
                    { name: '📝 How to use', value: 'Say "play [song name]" in voice chat\nExamples:\n- "play never gonna give you up"\n- "tugtugin despacito"', inline: false },
                    { name: '⚙️ Stop listening', value: 'Use `w!unlisten` to stop', inline: false }
                );
            }

            return message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Listen command error:', error);
            return message.reply('❌ An error occurred while processing the command.');
        }
    }
};

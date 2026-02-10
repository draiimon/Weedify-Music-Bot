const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listen')
        .setDescription('Enable or disable voice recognition for song requests')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Action to perform')
                .setRequired(true)
                .addChoices(
                    { name: 'Start Listening', value: 'on' },
                    { name: 'Stop Listening', value: 'off' },
                    { name: 'Check Status', value: 'status' }
                )),

    async execute(interaction, client) {
        try {
            const action = interaction.options.getString('action');

            // Check if user is in a voice channel (except for status check)
            if (action !== 'status' && !interaction.member.voice.channel) {
                return interaction.reply({
                    content: '❌ You need to be in a voice channel to use this command!',
                    ephemeral: true
                });
            }

            // Initialize voice recognition if not already done
            if (!client.voiceRecognition) {
                const VoiceRecognition = require('../../utils/voiceRecognition');
                client.voiceRecognition = new VoiceRecognition(client);
            }

            const guildId = interaction.guild.id;

            // Handle different actions
            if (action === 'off') {
                const result = client.voiceRecognition.stopListening(guildId);

                const embed = new EmbedBuilder()
                    .setColor(result.success ? 0xFF6B6B : 0xFF0000)
                    .setTitle(result.success ? '🔇 Voice Listening Disabled' : '❌ Error')
                    .setDescription(result.message)
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            }

            if (action === 'status') {
                const status = client.voiceRecognition.getStatus(guildId);

                const embed = new EmbedBuilder()
                    .setColor(status.listening ? 0x00FF00 : 0x808080)
                    .setTitle('🎤 Voice Listening Status')
                    .setDescription(status.listening ?
                        `✅ Currently listening in **${status.channel}**` :
                        '❌ Not listening in any channel')
                    .setTimestamp();

                if (status.listening) {
                    embed.addFields(
                        { name: 'Method', value: status.method.toUpperCase(), inline: true },
                        { name: 'Language', value: status.language, inline: true }
                    );
                }

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // action === 'on'
            const voiceChannel = interaction.member.voice.channel;
            const textChannel = interaction.channel;

            await interaction.deferReply();

            const result = await client.voiceRecognition.startListening(
                interaction.guild,
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
                    { name: '⚙️ Stop listening', value: 'Use `/listen off` or `w!unlisten`', inline: false }
                );
            }

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Listen slash command error:', error);

            if (interaction.deferred) {
                return interaction.editReply({ content: '❌ An error occurred while processing the command.' });
            } else {
                return interaction.reply({ content: '❌ An error occurred while processing the command.', ephemeral: true });
            }
        }
    }
};

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: "lstop",
    aliases: ["stoplistening", "leavevoice"],
    description: "Stops the voice recognition and leaves the voice channel",
    execute: async (message, args, client) => {
        try {
            const guildId = message.guild.id;

            // Check if voice recognition is active
            if (client.voiceRecognition && client.voiceRecognition.isListening(guildId)) {

                const result = client.voiceRecognition.stopListening(guildId);

                const embed = new EmbedBuilder()
                    .setColor(result.success ? '#00FF00' : '#FF0000')
                    .setDescription(result.message);

                return message.reply({ embeds: [embed] });
            } else {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#FF0000')
                            .setDescription('❌ I am not currently listening in this server.')
                    ]
                });
            }
        } catch (error) {
            console.error('Error in lstop command:', error);
            message.reply('❌ An error occurred while trying to stop listening.');
        }
    }
};

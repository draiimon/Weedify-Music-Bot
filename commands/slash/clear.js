const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');




module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear all songs from queue'),

    async execute(interaction, client) {
                await interaction.deferReply();

        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);

        try {
            const conditions = await checker.checkMusicConditions(
                interaction.guild.id,
                interaction.user.id,
                interaction.member.voice?.channelId
            );

            if (!conditions.hasActivePlayer || conditions.queueLength === 0) {
                const embed = new EmbedBuilder().setDescription('❌ Queue is empty!');
                return interaction.editReply({ embeds: [embed] })
            }

            const player = conditions.player;
            const clearedCount = player.queue.size;
            player.queue.clear();

            const embed = new EmbedBuilder().setDescription(`🗑️ Cleared **${clearedCount}** songs from queue!`);
            return interaction.editReply({ embeds: [embed] })

        } catch (error) {
            console.error('Slash Clear command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ An error occurred while clearing the queue!');
            return interaction.editReply({ embeds: [embed] })
        }
    }
};

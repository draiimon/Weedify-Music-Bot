const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');




module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a song from queue')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Position in queue (1, 2, 3...)')
                .setMinValue(1)
                .setRequired(true)
        ),

    async execute(interaction, client) {
                await interaction.deferReply();

        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);

        try {
            const conditions = await checker.checkMusicConditions(
                interaction.guild.id, interaction.user.id, interaction.member.voice?.channelId
            );

            if (!conditions.hasActivePlayer || conditions.queueLength === 0) {
                const embed = new EmbedBuilder().setDescription('❌ Queue is empty!');
                return interaction.editReply({ embeds: [embed] })
            }

            const position = interaction.options.getInteger('position');
            if (position > conditions.queueLength) {
                const embed = new EmbedBuilder().setDescription(`❌ Invalid position! Queue has only ${conditions.queueLength} songs.`);
                return interaction.editReply({ embeds: [embed] })
            }

            const player = conditions.player;
            const removedTrack = player.queue.remove(position - 1);

            const embed = new EmbedBuilder().setDescription(`🗑️ Removed: **${removedTrack.info.title}**`);
            return interaction.editReply({ embeds: [embed] })

        } catch (error) {
            console.error('Remove command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ An error occurred while removing the song!');
            return interaction.editReply({ embeds: [embed] })
        }
    }
};

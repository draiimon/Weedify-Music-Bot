const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');




module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop music and disconnect from voice channel'),

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

            if (!conditions.hasActivePlayer) {
                const embed = new EmbedBuilder().setDescription('❌ No music is currently playing!');
                return interaction.editReply({ embeds: [embed] })
            }

            if (!conditions.sameVoiceChannel) {
                const embed = new EmbedBuilder().setDescription('❌ You need to be in the same voice channel as the bot!');
                return interaction.editReply({ embeds: [embed] })
            }

            const player = conditions.player;
            player.stop();
            player.queue.clear();

            const embed = new EmbedBuilder().setDescription('🛑 Music stopped! Bot staying connected in voice channel.');
            return interaction.editReply({ embeds: [embed] })

        } catch (error) {
            console.error('Stop command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ An error occurred while stopping music!');
            return interaction.editReply({ embeds: [embed] })
        }
    }
};

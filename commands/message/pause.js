const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'pause',
    aliases: ['break', 'sandali', 'hinto'],
    description: 'Pause muna, pahinga saglit!',
    async execute(message, args, client) {        
        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);
        
        try {
            const conditions = await checker.checkMusicConditions(
                message.guild.id, 
                message.author.id, 
                message.member.voice?.channelId
            );

            const errorMsg = checker.getErrorMessage(conditions, 'pause');
            if (errorMsg) {
                const embed = new EmbedBuilder().setDescription(errorMsg);
                return message.reply({ embeds: [embed] })
            }

            const player = conditions.player;

            if (player.paused) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ **Nakapause na yan erp!** Check mo naman sah!')
                    .setColor(0xFF0000);
                return message.reply({ embeds: [embed] })
            }

            player.pause(true);
            const embed = new EmbedBuilder()
                .setDescription('⏸️ **Hinto muna day one!** Pinause ko na, chill lang!')
                .setColor(0x00FF00)
                .setFooter({ text: '🌿 Weedify Bot - Relax muna sah!' });
            return message.reply({ embeds: [embed] })

        } catch (error) {
            console.error('Pause command error:', error);
            const embed = new EmbedBuilder()
                .setDescription('❌ **May error sah!** Di ko ma-pause yan day one!')
                .setColor(0xFF0000);
            return message.reply({ embeds: [embed] })
        }
    }
};

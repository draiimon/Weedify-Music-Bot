const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'resume',
    aliases: ['r', 'continue', 'tuloy'],
    description: 'Tuloy ang laban! Resume na!',
    async execute(message, args, client) {        
        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);
        
        try {
            const conditions = await checker.checkMusicConditions(
                message.guild.id, 
                message.author.id, 
                message.member.voice?.channelId
            );

            if (!conditions.hasActivePlayer) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ **Wala naman tumutugtog sah!** Ano gusto mo i-resume?')
                    .setColor(0xFF0000);
                return message.reply({ embeds: [embed] })
            }

            if (!conditions.isPaused) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ **Tumutugtog na yan day one!** Check mo naman erp!')
                    .setColor(0xFF0000);
                return message.reply({ embeds: [embed] })
            }

            const player = conditions.player;
            player.pause(false);

            const embed = new EmbedBuilder()
                .setDescription('▶️ **Tuloy ulit sah!** Let\'s vibe day one!')
                .setColor(0x00FF00)
                .setFooter({ text: '🌿 Weedify Bot - Day One Vibes!' });
            return message.reply({ embeds: [embed] })

        } catch (error) {
            console.error('Resume command error:', error);
            const embed = new EmbedBuilder()
                .setDescription('❌ **May error erp!** Di ko ma-resume yan day one!')
                .setColor(0xFF0000);
            return message.reply({ embeds: [embed] })
        }
    }
};

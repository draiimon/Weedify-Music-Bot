const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'skip',
    aliases: ['s', 'next', 'laktaw', 'lipat'],
    description: 'Skip yung kanta, badtrip ka na ba?',
    async execute(message, args, client) {        
        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);
        
        try {
            const conditions = await checker.checkMusicConditions(
                message.guild.id, 
                message.author.id, 
                message.member.voice?.channelId
            );

            const errorMsg = checker.getErrorMessage(conditions, 'skip');
            if (errorMsg) {
                const embed = new EmbedBuilder().setDescription(errorMsg);
                return message.reply({ embeds: [embed] })
            }

            const player = conditions.player;
            const currentTrack = player.current?.info?.title || 'Unknown';

            player.stop();

            const embed = new EmbedBuilder()
                .setDescription(`⏭️ **G na yan sah!** Skip: **${currentTrack}**`)
                .setColor(0x00FF00)
                .setFooter({ text: '🌿 Weedify Bot - Day One Vibes!' });
            return message.reply({ embeds: [embed] })

        } catch (error) {
            console.error('Skip command error:', error);
            const embed = new EmbedBuilder()
                .setDescription('❌ **May error day one!** Di ko ma-skip yan sah!')
                .setColor(0xFF0000);
            return message.reply({ embeds: [embed] })
        }
    }
};

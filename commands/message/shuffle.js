const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'shuffle',
    aliases: ['mix', 'randomize', 'sh', 'halo'],
    description: 'Ihalo yung pila ng kanta',
    async execute(message, args, client) {        
        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);
        
        try {
            const conditions = await checker.checkMusicConditions(
                message.guild.id, 
                message.author.id, 
                message.member.voice?.channelId
            );

            if (!conditions.hasActivePlayer || conditions.queueLength === 0) {
                const embed = new EmbedBuilder().setDescription('❌ Walang laman yung pila, wala akong ihahalo pre!');
                return message.reply({ embeds: [embed] })
            }

            if (!conditions.sameVoiceChannel) {
                const embed = new EmbedBuilder().setDescription('❌ Pre, sumali ka muna sa VC ko! Di kita kasama eh!');
                return message.reply({ embeds: [embed] })
            }

            const player = conditions.player;
            player.queue.shuffle();

            const embed = new EmbedBuilder().setDescription(`🔀 G na! Hinaluan ko na **${conditions.queueLength}** kanta sa pila!`);
            return message.reply({ embeds: [embed] })

        } catch (error) {
            console.error('Shuffle command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ May error pre! Di ko mahalo yung queue!');
            return message.reply({ embeds: [embed] })
        }
    }
};

const { EmbedBuilder } = require('discord.js');




module.exports = {
    name: 'remove',
    aliases: ['rm', 'delete', 'del'],
    description: 'Remove a song from queue',
    async execute(message, args, client) {
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ System core offline - Command unavailable')
                .setColor('#FF0000');
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        const position = parseInt(args[0]);
        
        if (!position || position < 1) {
            const embed = new EmbedBuilder().setDescription('❌ Please provide a valid position number! Example: `!remove 3`');
            return message.reply({ embeds: [embed] })
        }

        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);
        
        try {
            const conditions = await checker.checkMusicConditions(
                message.guild.id, 
                message.author.id, 
                message.member.voice?.channelId
            );

            if (!conditions.hasActivePlayer || conditions.queueLength === 0) {
                const embed = new EmbedBuilder().setDescription('❌ Queue is empty!');
                return message.reply({ embeds: [embed] })
            }

            if (position > conditions.queueLength) {
                const embed = new EmbedBuilder().setDescription(`❌ Invalid position! Queue has only ${conditions.queueLength} songs.`);
                return message.reply({ embeds: [embed] })
            }

            const player = conditions.player;
            const removedTrack = player.queue.remove(position - 1);

            const embed = new EmbedBuilder().setDescription(`🗑️ Removed: **${removedTrack.info.title}**`);
            return message.reply({ embeds: [embed] })

        } catch (error) {
            console.error('Remove command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ An error occurred while removing the song!');
            return message.reply({ embeds: [embed] })
        }
    }
};

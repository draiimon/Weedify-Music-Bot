const { EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');


const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    name: 'clear',
    aliases: ['empty', 'clean', 'clearqueue'],
    description: 'Clear all songs from queue',
    securityToken: COMMAND_SECURITY_TOKEN,

    async execute(message, args, client) {
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ System core offline - Command unavailable')
                .setColor('#FF0000');
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        message.shivaValidated = true;
        message.securityToken = COMMAND_SECURITY_TOKEN;
        
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

            if (!conditions.sameVoiceChannel) {
                const embed = new EmbedBuilder().setDescription('❌ You need to be in the same voice channel as the bot!');
                return message.reply({ embeds: [embed] })
            }

            const player = conditions.player;
            const clearedCount = player.queue.size;
            player.queue.clear();

            const embed = new EmbedBuilder().setDescription(`🗑️ Cleared **${clearedCount}** songs from queue!`);
            return message.reply({ embeds: [embed] })

        } catch (error) {
            console.error('Clear command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ An error occurred while clearing queue!');
            return message.reply({ embeds: [embed] })
        }
    }
};

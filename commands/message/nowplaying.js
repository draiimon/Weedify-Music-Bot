const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'nowplaying',
    aliases: ['np', 'ngayon', 'anoyan'],
    description: 'Ano ba tumutugtog ngayon?',
    async execute(message, args, client) {        
        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);
        
        try {
            const conditions = await checker.checkMusicConditions(
                message.guild.id, 
                message.author.id, 
                message.member.voice?.channelId
            );

            if (!conditions.hasActivePlayer || !conditions.currentTrack) {
                const embed = new EmbedBuilder().setDescription('❌ Wala naman tumutugtog ngayon par!');
                return message.reply({ embeds: [embed] })
            }

            const track = conditions.currentTrack;
            const player = conditions.player;
            
            const duration = formatDuration(track.info.length);
            const position = formatDuration(player.position);
            const statusEmoji = player.paused ? '⏸️' : '▶️';
            const loopEmoji = getLoopEmoji(player.loop);

            const embed = new EmbedBuilder().setDescription(
                `${statusEmoji} **${track.info.title}**\n` +
                `Ni: ${track.info.author}\n` +
                `⏰ ${position} / ${duration}\n` +
                `👤 Request ni: <@${track.info.requester.id}>\n` +
                `🔊 Lakas: ${player.volume || 50}%\n` +
                `🔁 Loop: ${loopEmoji} ${player.loop || 'Off'}\n` +
                `📜 Pila: ${player.queue.size} kanta`
            );

            return message.reply({ embeds: [embed] })

        } catch (error) {
            console.error('Now playing command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ May error pre! Di ko makuha yung current song!');
            return message.reply({ embeds: [embed] })
        }
    }
};

function formatDuration(duration) {
    if (!duration) return '0:00';
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getLoopEmoji(loopMode) {
    switch (loopMode) {
        case 'track': return '🔂';
        case 'queue': return '🔁';
        default: return '➡️';
    }
}

const { EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    name: 'queue',
    aliases: ['q', 'list', 'pila', 'listahan'],
    description: 'Tingnan yung pila ng kanta',
    securityToken: COMMAND_SECURITY_TOKEN,
    
    async execute(message, args, client) {
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ May sira yung system pre - Di muna pwede')
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

            if (!conditions.hasActivePlayer) {
                const embed = new EmbedBuilder().setDescription('❌ Wala naman tumutugtog ngayon par!');
                return message.reply({ embeds: [embed] })
            }

            const player = conditions.player;
            const queue = player.queue;
            const currentTrack = player.current;
            
            if (!currentTrack && queue.size === 0) {
                const embed = new EmbedBuilder().setDescription('📜 Walang laman yung pila pre!');
                return message.reply({ embeds: [embed] })
            }

            const page = parseInt(args[0]) || 1;
            const songsPerPage = 15;
            const startIndex = (page - 1) * songsPerPage;
            const endIndex = startIndex + songsPerPage;
            const totalPages = Math.ceil(queue.size / songsPerPage);

            let description = '';

            if (currentTrack) {
                const duration = formatDuration(currentTrack.info.length);
                description += `🎵 **Tumutugtog Ngayon**\n**${currentTrack.info.title}**\nNi: ${currentTrack.info.author}\nTagal: ${duration}\nRequest ni: <@${currentTrack.info.requester.id}>\n\n`;
            }

            if (queue.size > 0) {
                const queueTracks = Array.from(queue).slice(startIndex, endIndex);
                if (queueTracks.length > 0) {
                    description += `📋 **Susunod na Tugtugin (${queue.size} kanta)**\n`;
                    description += queueTracks.map((track, index) => {
                        const position = startIndex + index + 1;
                        const duration = formatDuration(track.info.length);
                        return `\`${position}.\` **${track.info.title}** \`[${duration}]\`\nRequest ni: <@${track.info.requester.id}>`;
                    }).join('\n\n');
                }

                if (totalPages > 1) {
                    description += `\n\nPage ${page}/${totalPages}`;
                } else {
                    description += `\n\nTotal: ${queue.size} kanta sa pila`;
                }
            }

            const embed = new EmbedBuilder().setDescription(description);
            return message.reply({ embeds: [embed] })

        } catch (error) {
            console.error('Queue command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ May error pre! Di ko makuha yung queue!');
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

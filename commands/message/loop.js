const { EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    name: 'loop',
    aliases: ['repeat', 'ulit', 'l'],
    description: 'Ulit-ulitin yung kanta (off, track, queue)',
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
                const embed = new EmbedBuilder()
                    .setDescription('❌ **Wala naman tumutugtog sah!**')
                    .setColor(0xFF0000);
                return message.reply({ embeds: [embed] })
            }

            if (!conditions.sameVoiceChannel) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ **Oy day one!** Sumali ka muna sa VC ko erp!')
                    .setColor(0xFF0000);
                return message.reply({ embeds: [embed] })
            }

            const player = conditions.player;
            const mode = args?.toString().toLowerCase();
            const validModes = ['off', 'none', 'track', 'song', 'queue', 'all'];

            if (!mode || !validModes.includes(mode)) {
                const currentLoop = player.loop || 'none';
                const currentTrack = player.current;
                
                const modeEmojis = { none: '➡️', track: '🔂', queue: '🔁' };
                const modeNames = { none: 'Off', track: 'Track', queue: 'Queue' };

                let description = `🔁 **Current Loop Status:** ${modeEmojis[currentLoop]} **${modeNames[currentLoop]}**\n\n`;
                
                if (currentTrack && currentTrack.info) {
                    const duration = currentTrack.info.length ? this.formatDuration(currentTrack.info.length) : 'Unknown';
                    description += `🎵 **Now Playing:**\n`;
                    description += `**${currentTrack.info.title || 'Unknown Track'}**\n`;
                    description += `👤 ${currentTrack.info.author || 'Unknown Artist'}\n`;
                    description += `⏱️ ${duration}\n\n`;
                }
                
                description += `**Para mag-set ng loop:**\n\`w!loop off\` - Wala\n\`w!loop track\` - Isa lang\n\`w!loop queue\` - Lahat`;

                const embed = new EmbedBuilder()
                    .setDescription(description)
                    .setColor(0x00FF00)
                    .setFooter({ text: '🌿 Weedify Bot - Day One Vibes!' });
                
                if (currentTrack && currentTrack.info && currentTrack.info.artworkUrl) {
                    embed.setThumbnail(currentTrack.info.artworkUrl);
                }
                
                return message.reply({ embeds: [embed] })
            }

            let loopMode;
            if (mode === 'off' || mode === 'none') loopMode = 'none';
            else if (mode === 'track' || mode === 'song') loopMode = 'track';
            else if (mode === 'queue' || mode === 'all') loopMode = 'queue';

            player.setLoop(loopMode);

            const modeEmojis = { none: '➡️', track: '🔂', queue: '🔁' };
            const modeNames = { none: 'Wala na', track: 'Isa lang', queue: 'Lahat' };

            const embed = new EmbedBuilder()
                .setDescription(`${modeEmojis[loopMode]} **G na yan sah!** Loop: **${modeNames[loopMode]}**`)
                .setColor(0x00FF00)
                .setFooter({ text: '🌿 Weedify Bot - Day One Vibes!' });
            return message.reply({ embeds: [embed] })

        } catch (error) {
            console.error('Loop command error:', error);
            const embed = new EmbedBuilder()
                .setDescription('❌ **May error erp!** Di ko ma-set yung loop day one!')
                .setColor(0xFF0000);
            return message.reply({ embeds: [embed] })
        }
    },

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        }
        return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
    }
};

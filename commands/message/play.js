const { EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    name: 'play',
    aliases: ['p', 'music', 'tugtog', 'tugtugin'],
    description: 'Magtugtugan na! Lagay mo lang yung kanta',
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
        const PlayerHandler = require('../../utils/player');
        
        const query = args.join(' ');
        if (!query) {
            const embed = new EmbedBuilder()
                .setDescription('🌿 **Oy day one!** Ano ba gusto mo tugtugin? Lagay ka kanta dyan sah!')
                .setColor(0x00FF00);
            return message.reply({ embeds: [embed] })
        }

        try {
            const checker = new ConditionChecker(client);
            const conditions = await checker.checkMusicConditions(
                message.guild.id, 
                message.author.id, 
                message.member.voice?.channelId,
                false
            );

            const errorMsg = checker.getErrorMessage(conditions, 'play');
            if (errorMsg) {
                const embed = new EmbedBuilder().setDescription(errorMsg);
                return message.reply({ embeds: [embed] })
            }

            let targetVC = message.member.voice.channelId;
            if (conditions.centralEnabled && conditions.botInCentralVC && conditions.centralVC) {
                targetVC = conditions.centralVC;
            }

            const playerHandler = new PlayerHandler(client);
            const player = await playerHandler.createPlayer(
                message.guild.id,
                targetVC,
                message.channel.id
            );

            const result = await playerHandler.playSong(player, query, message.author);

            if (result.type === 'track') {
                const embed = new EmbedBuilder()
                    .setDescription(`🌿 **G yan sah!** Nilagay ko sa queue: **${result.track.info.title}**`)
                    .setColor(0x00FF00)
                    .setFooter({ text: '🌿 Weedify Bot - Day One Vibes!' });
                return message.reply({ embeds: [embed] })
            } else if (result.type === 'playlist') {
                const embed = new EmbedBuilder()
                    .setDescription(`🌿 **Sulit to erp!** Nilagay ko **${result.tracks}** kanta from playlist: **${result.name}**`)
                    .setColor(0x00FF00)
                    .setFooter({ text: '🌿 Weedify Bot - Grabe ka day one!' });
                return message.reply({ embeds: [embed] })
            } else {
                const embed = new EmbedBuilder()
                    .setDescription('❌ **Walang ganyan sah!** Check mo spelling mo day one')
                    .setColor(0xFF0000);
                return message.reply({ embeds: [embed] })
            }

        } catch (error) {
            const embed = new EmbedBuilder()
                .setDescription('❌ **May sira day one!** Di ko ma-play yan, may error sah!')
                .setColor(0xFF0000);
            console.error('Play command error:', error);
            return message.reply({ embeds: [embed] })
        }
    }
};

const { EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    name: 'volume',
    aliases: ['vol', 'v', 'lakas'],
    description: 'Ayusin yung lakas ng tugtog (1-100)',
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
        
        const volume = parseInt(args[0]);
        
        if (!volume || volume < 1 || volume > 100) {
            const embed = new EmbedBuilder()
                .setDescription('❌ **Lagay ka ng tamang level sah!** (1-100) Halimbawa: `w!volume 50`')
                .setColor(0xFF0000);
            return message.reply({ embeds: [embed] });
        }

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
                    .setDescription('❌ **Wala naman tumutugtog day one!**')
                    .setColor(0xFF0000);
                return message.reply({ embeds: [embed] })
            }

            if (!conditions.sameVoiceChannel) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ **Oy sah!** Sumali ka muna sa VC ko erp!')
                    .setColor(0xFF0000);
                return message.reply({ embeds: [embed] })
            }

            const player = conditions.player;
            player.setVolume(volume);

            const embed = new EmbedBuilder()
                .setDescription(`🔊 **G na yan day one!** Volume: **${volume}%**`)
                .setColor(0x00FF00)
                .setFooter({ text: '🌿 Weedify Bot - Chill vibes!' });
            return message.reply({ embeds: [embed] })

        } catch (error) {
            console.error('Volume command error:', error);
            const embed = new EmbedBuilder()
                .setDescription('❌ **May error sah!** Di ko ma-adjust yung volume day one!')
                .setColor(0xFF0000);
            return message.reply({ embeds: [embed] })
        }
    }
};

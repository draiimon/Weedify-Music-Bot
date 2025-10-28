const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'stop',
    aliases: ['disconnect', 'dc', 'alis', 'tigil', 'tara'],
    description: 'Tapos na! Aalis na ko sa VC',
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
                    .setDescription('❌ **Wala naman tumutugtog sah!** Ano gusto mo i-stop day one?')
                    .setColor(0xFF0000);
                return message.reply({ embeds: [embed] })
            }

            if (!conditions.sameVoiceChannel) {
                const embed = new EmbedBuilder()
                    .setDescription('❌ **Oy erp!** Sumali ka muna sa VC ko! Di kita kasama eh!')
                    .setColor(0xFF0000);
                return message.reply({ embeds: [embed] })
            }

            const player = conditions.player;
            player.stop();
            player.queue.clear();

            const embed = new EmbedBuilder()
                .setDescription('🛑 **G day one!** Tinigil ko na yung tugtog! Bot naka-standby pa sa VC!')
                .setColor(0x00FF00)
                .setFooter({ text: '🌿 Weedify Bot - Ready pag gusto mo ulit tumugtog sah!' });
            return message.reply({ embeds: [embed] })

        } catch (error) {
            console.error('Stop command error:', error);
            const embed = new EmbedBuilder()
                .setDescription('❌ **May error erp!** Di ako maka-disconnect sah!')
                .setColor(0xFF0000);
            return message.reply({ embeds: [embed] })
        }
    }
};

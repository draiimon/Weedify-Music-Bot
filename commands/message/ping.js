const { EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    name: 'ping',
    aliases: ['pong', 'latency'],
    description: 'Check kung mabilis ba ako!',
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

        try {
            const latency = Date.now() - message.createdTimestamp;
            const uptimeSeconds = Math.floor(client.uptime / 1000);
            const hours = Math.floor(uptimeSeconds / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const seconds = uptimeSeconds % 60;

            const embed = new EmbedBuilder()
                .setTitle('🌿 Pong sah! Mabilis ako no?')
                .setColor(0x00FF00)
                .setDescription(
                    `🌿 **Latency:** ${latency} ms\n` +
                    `🌿 **API Ping:** ${Math.round(client.ws.ping)} ms\n` +
                    `🌿 **Uptime:** ${hours}h ${minutes}m ${seconds}s\n\n` +
                    `**Tara na day one! Patugtog ka na erp!**`
                )
                .setTimestamp()
                .setFooter({ text: '🌿 Weedify Bot - Developed by Mason Calix' });

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Ping command error:', error);
            await message.reply('❌ **May error day one!** Di ko ma-check yung ping sah!');
        }
    }
};

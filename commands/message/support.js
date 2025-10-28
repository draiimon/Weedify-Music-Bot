const { EmbedBuilder } = require('discord.js');




module.exports = {
    name: 'support',
    description: 'Get support server and contact information',
    async execute(message) {
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ System core offline - Command unavailable')
                .setColor('#FF0000');
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        try {
            const embed = new EmbedBuilder()
                .setTitle('🛠️ Support & Contact')
                .setColor(0x1DB954)
                .setDescription(
                    'Need help or have questions? Join our official support server:\n' +
                    '[Support Server](https://discord.gg/xQF9f9yUEM)\n\n' +
                    'For direct inquiries, contact: **Mason Calix**\n\n' +
                    '🌿 Weedify Music Bot - Ang Pinakamaangas!'
                )
                .setTimestamp()
                .setFooter({ text: '🌿 Weedify Bot • Developed by Mason Calix' });
            
            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Support command error:', error);
            await message.reply('❌ An error occurred while fetching support information.');
        }
    }
};

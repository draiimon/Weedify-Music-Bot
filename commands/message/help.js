const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'help',
    aliases: ['h', 'tulong', 'commands'],
    description: 'Listahan ng lahat ng commands',
    async execute(message, args, client) {
        try {
            const msgCommandsPath = path.join(__dirname, '..', 'message');
            const msgFiles = fs.readdirSync(msgCommandsPath).filter(file => file.endsWith('.js'));
            const messageCommands = msgFiles.map(file => {
                const cmd = require(path.join(msgCommandsPath, file));
                return { name: cmd.name || 'Unknown', description: cmd.description || 'Walang deskripsyon' };
            });

            const slashCommandsPath = path.join(__dirname, '..', 'slash');
            const slashFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));
            const slashCommands = slashFiles.map(file => {
                const cmd = require(path.join(slashCommandsPath, file));
                return {
                    name: cmd.data?.name || 'Unknown',
                    description: cmd.data?.description || 'Walang deskripsyon'
                };
            });

            let description = `**🌿 Ano sah, need help day one?** Tumutugtog sa **${client.guilds.cache.size}** servers!\n\n`;
            description += `**Tara na! Patugtog ka na erp! 🌿**\n\n`;

            description += `**💬 Message Commands [${messageCommands.length}]:**\n`;
            messageCommands.forEach(cmd => {
                description += `🌿 \`w!${cmd.name}\` - ${cmd.description}\n`;
            });

            description += `\n**⚡ Slash Commands [${slashCommands.length}]:**\n`;
            slashCommands.forEach(cmd => {
                description += `🌿 \`/${cmd.name}\` - ${cmd.description}\n`;
            });

            if (description.length > 4096) {
                description = description.slice(0, 4093) + '...';
            }

            const embed = new EmbedBuilder()
                .setTitle('🌿 Weedify Bot - Day One Vibes!')
                .setColor(0x00FF00)
                .setDescription(description)
                .setThumbnail(client.user.displayAvatarURL())
                .setFooter({ text: '🌿 Weedify Bot - Developed by Mason Calix' })
                .setTimestamp();

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Help command error:', error);
            await message.reply('❌ **May error sah!** Di ko makuha yung commands day one!');
        }
    }
};

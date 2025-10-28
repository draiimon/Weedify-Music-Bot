const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'join',
    aliases: ['connect', 'summon', 'halika', 'tara'],
    description: 'Pasali ako sa VC mo!',
    async execute(message, args, client) {        
        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);
        
        try {
            const conditions = await checker.checkMusicConditions(
                message.guild.id, 
                message.author.id, 
                message.member.voice?.channelId
            );

            if (!conditions.userInVoice) {
                const embed = new EmbedBuilder().setDescription('❌ Pre, pumasok ka muna sa voice channel!');
                return message.reply({ embeds: [embed] })
            }

            if (!conditions.canJoinVoice) {
                const embed = new EmbedBuilder().setDescription('❌ Walang permission! Di ako makapasok sa VC mo!');
                return message.reply({ embeds: [embed] })
            }

            if (conditions.hasActivePlayer && conditions.sameVoiceChannel) {
                const embed = new EmbedBuilder().setDescription('✅ Nandito na ako sa VC mo par!');
                return message.reply({ embeds: [embed] })
            }

            const PlayerHandler = require('../../utils/player');
            const playerHandler = new PlayerHandler(client);
            
            await playerHandler.createPlayer(
                message.guild.id,
                message.member.voice.channelId,
                message.channel.id
            );

            const embed = new EmbedBuilder().setDescription(`✅ G! Pumasok na ko sa **${message.member.voice.channel.name}**!`);
            return message.reply({ embeds: [embed] })

        } catch (error) {
            console.error('Join command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ May error pre! Di ako makapasok sa VC!');
            return message.reply({ embeds: [embed] })
        }
    }
};

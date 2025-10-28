const config = require('../config');
const Server = require('../models/Server');
const { EmbedBuilder } = require('discord.js');

const userCooldowns = new Map();
const SPAM_THRESHOLD = 3;
const COOLDOWN_TIME = 5000;

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        try {
            const serverConfig = await Server.findById(message.guild.id);

            // Handle central system messages
            if (serverConfig?.centralSetup?.enabled &&
                message.channel.id === serverConfig.centralSetup.channelId) {
                return handleCentralMessage(message, client, serverConfig);
            }

            let commandName, args;

            // Check for prefix commands
            if (message.content.startsWith(config.bot.prefix)) {
                args = message.content.slice(config.bot.prefix.length).trim().split(/ +/);
                commandName = args.shift().toLowerCase();
            }
            // Check for mention commands
            else if (message.mentions.has(client.user) && !message.mentions.everyone) {
                const content = message.content.replace(`<@${client.user.id}>`, '').trim();
                args = content.split(/ +/);
                commandName = args.shift().toLowerCase();
            }
            else return;

            const command = findCommand(client, commandName);
            if (!command) return;

            await command.execute(message, args, client);

        } catch (error) {
            console.error('Error in messageCreate:', error);
            message.reply('There was an error executing that command!').catch(() => {});
        }
    }
};

/**
 * Find command by name or alias
 */
function findCommand(client, commandName) {
    return client.commands.get(commandName) ||
           client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
}

/**
 * Handle central system messages
 */
async function handleCentralMessage(message, client, serverConfig) {
    const userId = message.author.id;
    const now = Date.now();

    try {
        // Anti-spam check
        const userMessages = userCooldowns.get(userId) || [];
        const recentMessages = userMessages.filter(timestamp => now - timestamp < COOLDOWN_TIME);

        if (recentMessages.length >= SPAM_THRESHOLD) {
            return;
        }

        recentMessages.push(now);
        userCooldowns.set(userId, recentMessages);

        // Check if user can use central system
        const ConditionChecker = require('../utils/checks');
        const checker = new ConditionChecker(client);

        const canUse = await checker.canUseCentralSystem(message.guild.id, message.author.id);
        if (!canUse) {
            return;
        }

        const content = message.content.trim();

        // Check if it's a song query
        if (await isSongQuery(content)) {
            const voiceValidation = await validateCentralVoiceAccess(message, client, serverConfig);
            if (!voiceValidation.valid) {
                await message.react('❌').catch(() => {});
                await message.reply(voiceValidation.reason);
                return;
            }

            await handleCentralSongRequest(message, client, serverConfig, voiceValidation.voiceChannelId);
            await message.react('✅').catch(() => {});
        }

    } catch (error) {
        console.error('Error in central message handler:', error);
    }
}

/**
 * Check if message is a song query
 */
async function isSongQuery(content) {
    if (content.length < 2 || content.length > 200) return false;
    
    const urlPatterns = [
        /youtube\.com/,
        /youtu\.be/,
        /spotify\.com/,
        /soundcloud\.com/,
        /open\.spotify/,
        /music\.youtube/
    ];
    
    if (urlPatterns.some(pattern => pattern.test(content))) {
        return true;
    }
    
    const blockedWords = [
        'shut', 'stop', 'pause', 'skip', 'leave', 'disconnect',
        'queue', 'volume', 'loop', 'repeat', 'shuffle', 'clear'
    ];
    
    const lowerContent = content.toLowerCase();
    if (blockedWords.some(word => lowerContent === word || lowerContent.startsWith(word + ' '))) {
        return false;
    }
    
    return true;
}

/**
 * Validate voice access for central system
 */
async function validateCentralVoiceAccess(message, client, serverConfig) {
    const member = message.member;
    const voiceChannelId = member?.voice?.channelId;
    
    if (!voiceChannelId) {
        return {
            valid: false,
            reason: '❌ Pasok muna sa voice channel bago mag-request ng kanta!'
        };
    }

    const centralVCId = serverConfig.centralSetup.voiceChannelId;
    if (!centralVCId) {
        return {
            valid: false,
            reason: '❌ Wala pang naka-setup na central voice channel!'
        };
    }

    if (voiceChannelId !== centralVCId) {
        return {
            valid: false,
            reason: `❌ Pasok sa <#${centralVCId}> para mag-request ng kanta!`
        };
    }

    return {
        valid: true,
        voiceChannelId: centralVCId
    };
}

/**
 * Handle central system song requests
 */
async function handleCentralSongRequest(message, client, serverConfig, voiceChannelId) {
    try {
        const PlayerHandler = require('../utils/player');
        const playerHandler = new PlayerHandler(client);
        
        const player = await playerHandler.createPlayer(
            message.guild.id,
            voiceChannelId,
            serverConfig.centralSetup.channelId
        );

        const query = message.content.trim();
        const result = await playerHandler.playSong(player, query, message.author);

        if (result.type === 'track') {
            console.log(`🎵 Central: Added ${result.track.info.title} to queue`);
        } else if (result.type === 'playlist') {
            console.log(`🎵 Central: Added ${result.tracks} tracks from playlist`);
        }
        
    } catch (error) {
        console.error('Error handling central song request:', error);
        await message.react('❌').catch(() => {});
    }
}

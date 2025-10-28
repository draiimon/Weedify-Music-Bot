const Server = require('../models/Server');

class ConditionChecker {
    constructor(client) {
        this.client = client;
    }


    async checkMusicConditions(guildId, userId, voiceChannelId, fromCentral = false) {
        const player = this.client.riffy.players.get(guildId);
        const guild = this.client.guilds.cache.get(guildId);
        const member = guild?.members.cache.get(userId);
        const serverConfig = await Server.findById(guildId);


        const centralEnabled = serverConfig?.centralSetup?.enabled;
        const centralVC = serverConfig?.centralSetup?.vcChannelId;

        return {

            hasActivePlayer: !!player,
            isPlaying: player?.playing || false,
            isPaused: player?.paused || false,


            botVoiceChannel: player?.voiceChannel,
            userVoiceChannel: voiceChannelId,
            userInVoice: !!voiceChannelId,
            sameVoiceChannel: player?.voiceChannel === voiceChannelId,


            centralEnabled: centralEnabled,
            centralVC: centralVC,
            isCentralVC: centralVC === voiceChannelId,
            botInCentralVC: player?.voiceChannel === centralVC,
            fromCentral: fromCentral,


            canJoinVoice: member?.voice.channel ?
                member.voice.channel.permissionsFor(guild.members.me)?.has(['Connect', 'Speak']) : false,


            queueLength: player?.queue.size || 0,
            currentTrack: player?.current || null,


            player: player
        };
    }


    async canUseMusic(guildId, userId) {
        const serverConfig = await Server.findById(guildId);

        if (!serverConfig?.settings?.djRole) {
            return true;
        }

        const guild = this.client.guilds.cache.get(guildId);
        const member = guild?.members.cache.get(userId);

        return member?.roles.cache.has(serverConfig.settings.djRole) || false;
    }


    async canUseCentralSystem(guildId, userId) {
        const serverConfig = await Server.findById(guildId);

        if (!serverConfig?.centralSetup?.enabled) {
            return false;
        }

        if (!serverConfig.centralSetup.allowedRoles?.length) {
            return true;
        }

        const guild = this.client.guilds.cache.get(guildId);
        const member = guild?.members.cache.get(userId);

        return serverConfig.centralSetup.allowedRoles.some(roleId =>
            member?.roles.cache.has(roleId)
        );
    }


    getErrorMessage(conditions, action = 'play') {
        if (!conditions.userInVoice) {
            return '❌ Pre, pumasok ka muna sa voice channel para makapag-music!';
        }

        if (!conditions.canJoinVoice) {
            return '❌ Walang permission! Di ako makapasok sa VC mo!';
        }


        if (conditions.hasActivePlayer && !conditions.sameVoiceChannel) {

            if (conditions.botInCentralVC && !conditions.fromCentral) {
                if (conditions.centralEnabled && conditions.centralVC) {
                    return `❌ Nasa central music system ako ngayon! Sumali ka sa <#${conditions.centralVC}> o gamitin mo yung central channel para mag-control ng music!`;
                }
            }

            if (!conditions.botInCentralVC && conditions.fromCentral && conditions.centralVC) {
                return null;
            }

            return '❌ May tumutugtog na ako sa ibang voice channel pre!';
        }

        if (action === 'skip' && !conditions.isPlaying) {
            return '❌ Wala naman tumutugtog na pwede i-skip!';
        }

        if (action === 'pause' && !conditions.isPlaying) {
            return '❌ Wala naman tumutugtog na pwede i-pause!';
        }

        return null;
    }
}

module.exports = ConditionChecker;

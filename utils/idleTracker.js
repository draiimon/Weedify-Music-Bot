class IdleTracker {
    constructor(client) {
        this.client = client;
        this.idleTimers = new Map();
        this.idleTimeout = 5 * 60 * 1000;
    }

    startIdleTimer(guildId) {
        this.clearIdleTimer(guildId);
        
        const timer = setTimeout(async () => {
            try {
                const player = this.client.riffy?.players.get(guildId);
                
                if (player && !player.playing && player.queue.size === 0) {
                    console.log(`⏱️ Idle timeout reached for ${guildId}, disconnecting...`);
                    
                    if (player.textChannel) {
                        try {
                            const channel = await this.client.channels.fetch(player.textChannel);
                            if (channel && channel.isTextBased()) {
                                const { EmbedBuilder } = require('discord.js');
                                
                                const embed = new EmbedBuilder()
                                    .setColor(0xFFA500)
                                    .setTitle('💤 Idle Disconnect')
                                    .setDescription('Umalis na ako dahil walang tumutugtog ng matagal. Para sa resources optimization!')
                                    .setFooter({ text: 'I-play ulit gamit ang w!play o /play' })
                                    .setTimestamp();
                                
                                await channel.send({ embeds: [embed] });
                            }
                        } catch (error) {
                            console.error('Failed to send idle disconnect message:', error.message);
                        }
                    }
                    
                    player.destroy();
                    this.clearIdleTimer(guildId);
                }
            } catch (error) {
                console.error('Idle timer error:', error.message);
                this.clearIdleTimer(guildId);
            }
        }, this.idleTimeout);
        
        this.idleTimers.set(guildId, timer);
        console.log(`⏱️ Started idle timer for guild ${guildId} (${this.idleTimeout / 1000}s)`);
    }

    clearIdleTimer(guildId) {
        const timer = this.idleTimers.get(guildId);
        if (timer) {
            clearTimeout(timer);
            this.idleTimers.delete(guildId);
            console.log(`⏱️ Cleared idle timer for guild ${guildId}`);
        }
    }

    resetIdleTimer(guildId) {
        this.startIdleTimer(guildId);
    }

    cleanup() {
        for (const [guildId, timer] of this.idleTimers) {
            clearTimeout(timer);
        }
        this.idleTimers.clear();
        console.log('🗑️ Cleared all idle timers');
    }
}

module.exports = IdleTracker;

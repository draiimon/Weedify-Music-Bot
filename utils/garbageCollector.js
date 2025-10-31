class GarbageCollector {
    static init(client) {
        setInterval(() => {
            if (global.gc) {
                global.gc();
                console.log('🗑️ Garbage collection completed');
            }
        }, 300000);
        
        setInterval(() => {
            const memUsage = process.memoryUsage();
            const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
            
            console.log(`📊 Memory: ${memMB}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
            
            if (memMB > 200) { 
                console.warn(`⚠️ High memory usage: ${memMB}MB - forcing cleanup`);
                
                if (client?.riffy) {
                    const players = Array.from(client.riffy.players.values());
                    players.forEach(player => {
                        if (!player.playing && player.queue.size === 0) {
                            console.log(`🗑️ Cleaning up idle player in guild ${player.guildId}`);
                            try {
                                player.destroy();
                            } catch (error) {
                                console.error('Player cleanup error:', error.message);
                            }
                        }
                    });
                }
                
                if (global.gc) {
                    global.gc();
                    console.log('🗑️ Forced garbage collection due to high memory');
                }
            }
        }, 120000);
        
        setInterval(() => {
            if (client?.riffy) {
                const players = Array.from(client.riffy.players.values());
                const activePlayers = players.filter(p => p.playing).length;
                const idlePlayers = players.filter(p => !p.playing && p.queue.size === 0).length;
                
                if (idlePlayers > 0) {
                    console.log(`🎵 Players: ${activePlayers} active, ${idlePlayers} idle`);
                }
            }
        }, 600000);
    }
    
    static forceCleanup() {
        if (global.gc) {
            global.gc();
            console.log('🗑️ Manual garbage collection');
        }
    }
}

module.exports = GarbageCollector;

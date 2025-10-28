/**
 * Weedify Music Bot Configuration
 * 
 * @version 1.0.0
 */

const env = process.env;

module.exports = {
    discord: {
        token: env.TOKEN || ""
    },
    mongodb: {
        uri: env.MONGODB_URI || ""  
    },
    
    lavalink: {
        host: env.LAVALINK_HOST || "lava-all.ajieblogs.eu.org", 
        port: parseInt(env.LAVALINK_PORT) || 443,       
        password: env.LAVALINK_PASSWORD || "https://dsc.gg/ajidevserver", 
        secure: env.LAVALINK_SECURE === 'false' ? false : true
    },
    
    bot: {
        prefix: env.BOT_PREFIX || "w!",
        ownerIds: ["1004206704994566164"],
        embedColor: 0x00FF00,
        supportServer: "https://discord.gg/weedify",
        defaultStatus: "🔥 Weedify - Tumugtog na mga par!"
    },
    
    features: {
        autoplay: true,
        centralSystem: true,
        autoVcCreation: true,
        updateStatus: true,
        autoDeaf: true,
        autoMute: false,
        resetOnEnd: true
    }
};

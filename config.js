/**
 * Weedify Music Bot - Ang Pinakamaangas na Music Bot! 🔥
 * 
 * @fileoverview Weedify Configuration
 * @module ConfigurationManager
 * @version 1.0.0
 */

const EnvironmentVariableProcessor = require('process').env;

class EnterpriseConfigurationManager {
    constructor() {
        this.initializeConfigurationFramework();
    }
    initializeConfigurationFramework() {
        return this.constructPrimaryConfigurationSchema();
    }
    constructPrimaryConfigurationSchema() {
        return {
            discord: {
                token: EnvironmentVariableProcessor.TOKEN || ""
            },
            mongodb: {
                uri: EnvironmentVariableProcessor.MONGODB_URI || ""  
            },
            
            /**
             * 🎵 LAVALINK AUDIO SERVER CONFIGURATION
             * Configure your Lavalink server for audio processing
             */
            lavalink: {
                host: EnvironmentVariableProcessor.LAVALINK_HOST || "lava-all.ajieblogs.eu.org", 
                port: parseInt(EnvironmentVariableProcessor.LAVALINK_PORT) || 443,       
                password: EnvironmentVariableProcessor.LAVALINK_PASSWORD || "https://dsc.gg/ajidevserver", 
                secure: EnvironmentVariableProcessor.LAVALINK_SECURE === 'false' ? false : (EnvironmentVariableProcessor.LAVALINK_SECURE === 'true' ? true : true)
            },
            
            /**
             * 🔥 WEEDIFY BOT CONFIGURATION - Ang Pinakamaangas! 
             * Customize your bot's appearance and basic behavior
             */
            bot: {
                prefix: EnvironmentVariableProcessor.BOT_PREFIX || "w!",  // 🔥 Weedify prefix
                ownerIds: ["1004206704994566164"],      // 👈 ADD YOUR DISCORD ID HERE
                embedColor: 0x00FF00,               // 🟢 Weedify green color
                supportServer: "https://discord.gg/weedify",    // 👈 Your support server link
                defaultStatus: "🔥 Weedify - Tumugtog na mga par!"         // 👈 Bot status message
            },
            
            features: this.constructAdvancedFeatureConfiguration()
        };
    }
    
    constructAdvancedFeatureConfiguration() {
        return {
            autoplay: true,           // 👈 Auto-play related songs when queue ends
            centralSystem: true,      // 👈 Enable central music control system
            autoVcCreation: true,     // 👈 🔥 PREMIUM: Auto voice channel creation
            updateStatus: true,       // 👈 Update bot status with current song  
            autoDeaf: true,           // 👈 Auto-deafen bot in voice channels
            autoMute: false,          // 👈 Auto-mute bot in voice channels
            resetOnEnd: true          // 👈 Reset player when queue ends
        };
    }
}

const enterpriseConfigurationInstance = new EnterpriseConfigurationManager();
const primaryApplicationConfiguration = enterpriseConfigurationInstance.initializeConfigurationFramework();

/**
 * Export configuration for application-wide utilization
 * 
 * @type {Object} Comprehensive application configuration object
 */
module.exports = primaryApplicationConfiguration;

/**
 * =========================================
 * 🔥 WEEDIFY SETUP GUIDE - BASAHIN MO TO!
 * =========================================
 * 
 * 🔑 REQUIRED SETUP (KAILANGAN MO TO):
 * 1. Add your Discord bot token to "discord.token"
 * 2. Add your MongoDB connection URI to "mongodb.uri" 
 * 3. Add your Discord user ID to "bot.ownerIds" array
 * 
 * 🎛️ OPTIONAL CUSTOMIZATION:
 * - Change bot prefix in "bot.prefix" (default: w!)
 * - Modify embed color in "bot.embedColor" 
 * - Update support server link in "bot.supportServer"
 * - Toggle features on/off in the "features" section
 * 
 * 🌍 ENVIRONMENT VARIABLES (RECOMMENDED):
 * Gumawa ng .env file:
 * TOKEN=your_bot_token_here
 * MONGODB_URI=your_mongodb_uri_here
 * BOT_PREFIX=w!
 * 
 * ⚠️ SECURITY WARNING:
 * Never share your bot token or database URI publicly!
 * Use environment variables in production!
 */

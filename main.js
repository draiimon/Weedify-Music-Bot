/**
 * Weedify Music Bot
 * Main bot initialization
 * 
 * @version 1.0.0
 * @author Mason Calix
 */

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Riffy } = require('riffy');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const connectDatabase = require('./database/connection');
const PlayerHandler = require('./utils/player');
const StatusManager = require('./utils/statusManager');
const GarbageCollector = require('./utils/garbageCollector');
const createServer = require('./server');
require('dotenv').config();

/**
 * Initialize Discord client with required intents
 */
function createClient() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.GuildPresences
        ]
    });

    // Initialize command collections
    client.commands = new Collection();
    client.slashCommands = new Collection();
    client.mentionCommands = new Collection();

    return client;
}

/**
 * Initialize Riffy audio system
 */
function initializeAudio(client) {
    const nodes = [{
        host: config.lavalink.host,
        password: config.lavalink.password,
        port: config.lavalink.port,
        secure: config.lavalink.secure
    }];

    const riffy = new Riffy(client, nodes, {
        send: (payload) => {
            const guild = client.guilds.cache.get(payload.d.guild_id);
            if (guild) {
                guild.shard.send(payload);
            }
        },
        defaultSearchPlatform: "ytmsearch",
        restVersion: "v4"
    });

    client.riffy = riffy;

    // Setup Riffy event handlers
    riffy.on('nodeConnect', (node) => {
        console.log(`✅ Lavalink node "${node.name}" connected successfully`);
    });

    riffy.on('nodeError', (node, error) => {
        console.error(`🔴 Lavalink node "${node.name}" error:`, error.message);

        setTimeout(() => {
            if (!node.connected) {
                console.log(`🔄 Attempting to reconnect to Lavalink node "${node.name}"...`);
                try {
                    node.connect();
                } catch (reconnectError) {
                    console.error(`❌ Failed to reconnect to node:`, reconnectError.message);
                }
            }
        }, 5000);
    });

    riffy.on('nodeDisconnect', (node, reason) => {
        console.warn(`⚠️ Lavalink node "${node.name}" disconnected. Reason:`, reason);

        setTimeout(() => {
            console.log(`🔄 Attempting to reconnect to Lavalink node "${node.name}"...`);
            try {
                node.connect();
            } catch (reconnectError) {
                console.error(`❌ Failed to reconnect to node:`, reconnectError.message);
            }
        }, 3000);
    });

    riffy.on('nodeReconnect', (node) => {
        console.log(`🔄 Reconnecting to Lavalink node "${node.name}"...`);
    });

    // Handle voice state updates
    client.on('raw', (payload) => {
        if (['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'].includes(payload.t)) {
            riffy.updateVoiceState(payload);
        }
    });

    return riffy;
}

/**
 * Load all message commands
 */
function loadMessageCommands(client) {
    const commandPath = path.join(__dirname, 'commands', 'message');

    if (!fs.existsSync(commandPath)) return 0;

    const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(commandPath, file));
        client.commands.set(command.name, command);
    }

    return commandFiles.length;
}

/**
 * Load all slash commands
 */
function loadSlashCommands(client) {
    const commandPath = path.join(__dirname, 'commands', 'slash');

    if (!fs.existsSync(commandPath)) return 0;

    const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(commandPath, file));
        client.slashCommands.set(command.data.name, command);
    }

    return commandFiles.length;
}

/**
 * Load all event handlers
 */
function loadEvents(client) {
    const eventPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const event = require(path.join(eventPath, file));

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }

    return eventFiles.length;
}

/**
 * Main bootstrap function
 */
async function bootstrap() {
    try {
        // Create client
        const client = createClient();

        // Initialize subsystems
        client.statusManager = new StatusManager(client);
        client.playerHandler = new PlayerHandler(client);

        // Connect to database
        const dbConnection = await connectDatabase();
        if (dbConnection) {
            console.log('✅ MongoDB connected successfully');
        } else {
            console.warn('⚠️ Running without MongoDB - features limited');
        }

        // Load commands and events
        const messageCommands = loadMessageCommands(client);
        const slashCommands = loadSlashCommands(client);
        console.log(`✅ Loaded ${messageCommands + slashCommands} commands`);

        const events = loadEvents(client);
        console.log(`✅ Loaded ${events} events`);

        // Initialize memory optimization
        GarbageCollector.init(client);

        // Initialize audio system
        initializeAudio(client);

        // Initialize player events
        client.playerHandler.initializeEvents();

        // Login to Discord
        const token = config.discord.token || process.env.TOKEN;
        await client.login(token);

        // Start HTTP server for Render deployment
        createServer(client);

        // Setup process error handlers
        setupErrorHandlers(client);

    } catch (error) {
        console.error('❌ Failed to initialize bot:', error);
        process.exit(1);
    }
}

/**
 * Setup global error handlers for stability
 */
function setupErrorHandlers(client) {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('❌ Uncaught Exception:', error);
        // Don't exit - try to keep running
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Promise Rejection:', reason);
        // Don't exit - try to keep running
    });

    // Handle SIGTERM (Render restart signal)
    process.on('SIGTERM', async () => {
        console.log('⚠️ SIGTERM received, shutting down gracefully...');

        try {
            // Destroy all voice connections
            if (client.riffy?.players) {
                for (const [guildId, player] of client.riffy.players) {
                    try {
                        player.destroy();
                    } catch (err) {
                        console.error(`Error destroying player for ${guildId}:`, err);
                    }
                }
            }

            // Logout from Discord
            await client.destroy();
            console.log('✅ Graceful shutdown complete');
            process.exit(0);
        } catch (error) {
            console.error('Error during shutdown:', error);
            process.exit(1);
        }
    });

    // Discord client error handler
    client.on('error', (error) => {
        console.error('❌ Discord Client Error:', error);
    });

    // Discord client warning handler  
    client.on('warn', (warning) => {
        console.warn('⚠️ Discord Client Warning:', warning);
    });
}

// Start the bot
bootstrap();

module.exports = createClient;

/**
 * Weedify Music Bot - 2026 Edition
 * Consolidated Entry Point
 * 
 * @version 2.0.0
 * @author Weedify Dev
 */

require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Riffy } = require('riffy');
const fs = require('fs');
const path = require('path');
const express = require('express');

// Imports
const config = require('./config');
const connectDatabase = require('./database/connection');
const PlayerHandler = require('./utils/player');
const StatusManager = require('./utils/statusManager');
const GarbageCollector = require('./utils/garbageCollector');

// --- 1. Client Initialization ---
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

client.commands = new Collection();
client.slashCommands = new Collection();
client.mentionCommands = new Collection();

// --- 2. Audio System (Riffy/Lavalink) ---
const nodes = [{
    host: config.lavalink.host,
    password: config.lavalink.password,
    port: config.lavalink.port,
    secure: config.lavalink.secure
}];

client.riffy = new Riffy(client, nodes, {
    send: (payload) => {
        const guild = client.guilds.cache.get(payload.d.guild_id);
        if (guild) guild.shard.send(payload);
    },
    defaultSearchPlatform: "ytmsearch",
    restVersion: "v4"
});

// Audio Events
client.riffy.on('nodeConnect', node => console.log(`🎵 [Lavalink] Node "${node.name}" Connected`));
client.riffy.on('nodeError', (node, error) => console.error(`🔴 [Lavalink] Node "${node.name}" Error:`, error.message));
client.on('raw', d => {
    if (['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'].includes(d.t)) client.riffy.updateVoiceState(d);
});

// --- 3. Command & Event Loader ---
const loadFiles = (dir) => fs.readdirSync(path.join(__dirname, dir)).filter(f => f.endsWith('.js'));

// Load Message Commands
if (fs.existsSync(path.join(__dirname, 'commands/message'))) {
    loadFiles('commands/message').forEach(file => {
        const cmd = require(`./commands/message/${file}`);
        client.commands.set(cmd.name, cmd);
    });
}

// Load Slash Commands
if (fs.existsSync(path.join(__dirname, 'commands/slash'))) {
    loadFiles('commands/slash').forEach(file => {
        const cmd = require(`./commands/slash/${file}`);
        client.slashCommands.set(cmd.data.name, cmd);
    });
}

// Load Events
if (fs.existsSync(path.join(__dirname, 'events'))) {
    loadFiles('events').forEach(file => {
        const event = require(`./events/${file}`);
        if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
        else client.on(event.name, (...args) => event.execute(...args, client));
    });
}

// --- 4. Subsystems ---
client.statusManager = new StatusManager(client);
client.playerHandler = new PlayerHandler(client); // Uses Riffy inside
client.playerHandler.initializeEvents();
GarbageCollector.init(client);

// --- 5. Error Handling & 2026 Stability ---
process.on('uncaughtException', err => console.error('💥 Uncaught Exception:', err));
process.on('unhandledRejection', err => console.error('💥 Unhandled Rejection:', err));

client.on('debug', info => {
    // Only log critical debug info or heartbeat (optional)
    if (info.includes('Heartbeat')) console.log('💓 Heartbeat verified');
});

// --- 6. Render Keep-Alive Server ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Weedify Bot is Online 🟢'));
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌍 Web Server listening on port ${PORT}`);
});

// --- 7. Bootstrap ---
(async () => {
    console.log('🚀 Booting up Weedify 2026 System...');

    // DB
    const db = await connectDatabase();
    if (db) console.log('💾 Database Connected');

    // Login
    const token = config.discord.token || process.env.TOKEN;
    if (!token) {
        console.error('❌ NO TOKEN FOUND. Check Render Environment Variables.');
        process.exit(1);
    }

    console.log(`🔐 Token found. Length: ${token.length}. Starts with: ${token.substring(0, 5)}...`);

    // Explicit Ready Event to debug "Offline" status
    client.once('ready', (c) => {
        console.log(`✅ [DIRECT DEBUG] Ready! Logged in as ${c.user.tag}`);
        c.user.setActivity('Weedify 2026', { type: 4 }); // Custom Status
        c.user.setStatus('online');
    });

    try {
        await client.login(token);
        console.log(`🤖 Login function called... waiting for Ready event.`);
    } catch (e) {
        console.error('❌ LOGIN FAILED:', e);
    }
})();

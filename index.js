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

// FORCE LOAD LIBSODIUM BEFORE ANYTHING ELSE
try {
    require('libsodium-wrappers');
    console.log("✅ libsodium-wrappers loaded manually.");
} catch (e) {
    console.error("❌ Failed to load libsodium-wrappers:", e);
}

const connectDatabase = require('./database/connection');
const PlayerHandler = require('./utils/player');
const StatusManager = require('./utils/statusManager');
const GarbageCollector = require('./utils/garbageCollector');

console.log('🚀 INITIALIZING WEEDIFY 2026 SYSTEM...');

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
const nodes = [
    // 1. AjieBlogs v4 (SSL - Port 443) - From BotXLab List
    {
        host: "lava-v4.ajieblogs.eu.org",
        password: "https://dsc.gg/ajidevserver",
        port: 443,
        secure: true
    },
    // 2. DivaHost (Non-SSL - Port 60002)
    {
        host: "lavalink.divahost.net",
        password: "divahostv4",
        port: 60002,
        secure: false
    },
    // 3. Musik Hosting (SSL - Port 443)
    {
        host: "lavalink-v2.pericsq.ro",
        password: "wwweasycodero",
        port: 443,
        secure: true
    },
    // 4. Sanode US (Non-SSL - Port 25568)
    {
        host: "us.sanode.xyz",
        password: "discord.gg/W2GheK3F9m",
        port: 25568,
        secure: false
    }
];

console.log(`🎵 Configuring Lavalink Node: ${nodes[0].host}`);

client.riffy = new Riffy(client, nodes, {
    send: (payload) => {
        const guild = client.guilds.cache.get(payload.d.guild_id);
        if (guild) guild.shard.send(payload);
    },
    defaultSearchPlatform: "ytmsearch",
    restVersion: "v4"
});

// Audio Events - VERBOSE LOGGING
client.riffy.on('nodeConnect', node => console.log(`✅ [Lavalink] Node "${node.name}" Connected!`));
client.riffy.on('nodeError', (node, error) => console.error(`🔴 [Lavalink] Node "${node.name}" Error: ${error.message}`));
client.riffy.on('nodeDisconnect', (node, reason) => console.warn(`⚠️ [Lavalink] Node "${node.name}" Disconnected: ${JSON.stringify(reason)}`));
client.riffy.on('debug', msg => console.log(`🐞 [Lavalink Debug] ${msg}`));

client.on('raw', d => {
    if (['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'].includes(d.t)) {
        client.riffy.updateVoiceState(d);
    }
});

// --- 3. Command & Event Loader ---
const loadFiles = (dir) => {
    const p = path.join(__dirname, dir);
    if (!fs.existsSync(p)) return [];
    return fs.readdirSync(p).filter(f => f.endsWith('.js'));
};

// Load Message Commands
loadFiles('commands/message').forEach(file => {
    const cmd = require(`./commands/message/${file}`);
    client.commands.set(cmd.name, cmd);
});

// Load Slash Commands
loadFiles('commands/slash').forEach(file => {
    const cmd = require(`./commands/slash/${file}`);
    client.slashCommands.set(cmd.data.name, cmd);
});

// Load Events
loadFiles('events').forEach(file => {
    const event = require(`./events/${file}`);
    if (event.name === 'clientReady') {
        console.warn(`⚠️ Correcting event name 'clientReady' to 'ready' for ${file}`);
        event.name = 'ready'; // AUTO-FIX INTENT TYPO
    }
    if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
    else client.on(event.name, (...args) => event.execute(...args, client));
});

console.log(`📦 Loaded ${client.commands.size} commands and ${client.slashCommands.size} slash commands.`);

// --- 4. Subsystems ---
client.statusManager = new StatusManager(client);
client.playerHandler = new PlayerHandler(client);
client.playerHandler.initializeEvents();
GarbageCollector.init(client);

// --- 5. Error Handling & Stability ---
process.on('uncaughtException', err => console.error('💥 Uncaught Exception:', err));
process.on('unhandledRejection', err => console.error('💥 Unhandled Rejection:', err));

client.on('debug', info => {
    if (info.includes('Heartbeat') || info.includes('401')) console.log(`🐞 [Discord Debug] ${info}`);
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
    // DB
    const db = await connectDatabase();
    if (db) console.log('💾 Database Connected');

    // Login
    const token = config.discord.token || process.env.TOKEN;
    if (!token) {
        console.error('❌ NO TOKEN FOUND. Check Render Environment Variables.');
        process.exit(1);
    }

    console.log(`🔐 Token Check: ${token.substring(0, 5)}... (Length: ${token.length})`);

    // DEBUG: Explicit Ready Log
    client.once('ready', (c) => {
        console.log(`✅ [DIRECT DEBUG] Ready! Logged in as ${c.user.tag}`);
        console.log('🔄 Initializing Riffy/Lavalink...');
        client.riffy.init(c.user.id);
    });

    try {
        await client.login(token);
    } catch (e) {
        console.error('❌ LOGIN FAILED:', e);
    }
})();

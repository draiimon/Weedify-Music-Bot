# 🔥 Weedify Music Bot

## Project Overview
Weedify is a Discord music bot with **Tagalog commands** and **maangas (cool/edgy)** response style. Built on the UltimateMusic bot framework, customized with Filipino language and culture.

**Status:** ✅ RUNNING  
**Bot Name:** Weedify#0724  
**Command Prefix:** `g!`  
**Language:** Tagalog with English alternatives

## Recent Changes (Oct 28, 2025)
- ✅ Cloned UltimateMusic bot base
- ✅ Updated config with `g!` prefix and Weedify branding
- ✅ Converted all 18 message commands to Tagalog
- ✅ Updated utility error messages to Tagalog
- ✅ Fixed Lavalink server to working public node (SSL)
- ✅ Created comprehensive README and .env.example
- ✅ Bot successfully running with MongoDB + Lavalink connected

## Architecture

### Tech Stack
- **Discord.js v14** - Discord bot framework
- **Riffy** - Lavalink client for music playback
- **MongoDB/Mongoose** - Database for server settings
- **Express** - Web server (port 3000)
- **Node.js 20** - Runtime

### Project Structure
```
.
├── commands/
│   ├── message/      # Prefix commands (g!)
│   └── slash/        # Slash commands (/)
├── database/         # MongoDB connection
├── events/           # Discord event handlers
├── models/           # Mongoose schemas
├── utils/            # Helper utilities
├── config.js         # Bot configuration
├── main.js           # Bot initialization
├── index.js          # Entry point + web server
└── shiva.js          # Security module
```

## Commands (g! prefix)

### Music Commands
- `g!play <kanta>` - Play music (aliases: p, tugtog, tugtugin)
- `g!skip` - Skip current song (aliases: s, laktaw, lipat)
- `g!stop` - Stop and disconnect (aliases: dc, alis, tigil)
- `g!pause` - Pause playback (aliases: sandali, hinto)
- `g!resume` - Resume playback (aliases: r, tuloy)
- `g!queue` - Show queue (aliases: q, pila, listahan)
- `g!nowplaying` - Current song info (aliases: np, ngayon, anoyan)
- `g!volume <1-100>` - Adjust volume (aliases: vol, v, lakas)
- `g!loop <mode>` - Set loop mode (aliases: repeat, ulit)
- `g!shuffle` - Shuffle queue (aliases: mix, sh, halo)
- `g!join` - Join voice channel (aliases: halika, tara)

### Info Commands
- `g!help` - Show all commands (aliases: h, tulong)
- `g!ping` - Check bot latency (aliases: pong, latency)

## Configuration

### Required Secrets (Set in Replit)
- `TOKEN` - Discord bot token
- `MONGODB_URI` - MongoDB connection string

### Optional Environment Variables
- `BOT_PREFIX` - Command prefix (default: `g!`)
- `LAVALINK_HOST` - Lavalink server host
- `LAVALINK_PORT` - Lavalink server port
- `LAVALINK_PASSWORD` - Lavalink password
- `LAVALINK_SECURE` - SSL enabled (true/false)

### Current Lavalink Server
- Host: `lava-all.ajieblogs.eu.org`
- Port: `443` (SSL)
- Password: `https://dsc.gg/ajidevserver`
- Status: ✅ Connected

## User Preferences
- Language: Tagalog with "maangas" (cool/edgy) tone
- Command prefix: `g!`
- Bot personality: Casual, friendly, street-smart Filipino style

## Known Issues / Notes
- Public Lavalink servers may have downtime - monitor uptime
- Bot requires both Discord token and MongoDB to run
- Music playback requires working Lavalink connection
- Port 3000 used for Express web server (status page)

## Next Steps (Optional)
1. Add custom Lavalink server for better reliability
2. Implement more Tagalog slash commands
3. Add Filipino music source plugins
4. Create custom emojis for Filipino vibe
5. Add DJ role permissions system

## Support
For issues or questions, check the README.md or create an issue.

---
**Last Updated:** October 28, 2025  
**Bot Version:** 1.0.0 (Weedify Edition)

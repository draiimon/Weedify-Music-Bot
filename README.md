# 🔥 Weedify Music Bot - Ang Pinakamaangas na Music Bot!

Isang powerful Discord music bot na may Tagalog commands at maangas na responses! Built with Discord.js at Riffy/Lavalink para sa high-quality music streaming.

## ✨ Features

- 🎵 **High-Quality Music Streaming** - YouTube, Spotify, at iba pang sources
- 🔥 **Tagalog Commands** - Maangas at easy to understand!
- 🎚️ **Full Music Control** - Play, pause, skip, queue management
- 📋 **Queue System** - Organize your playlist
- 🔁 **Loop Modes** - Track loop o queue loop
- 🔀 **Shuffle** - Random order ng queue
- 🔊 **Volume Control** - Adjust from 1-100%
- ⚡ **Slash Commands** - Modern Discord interactions
- 💾 **Database Integration** - MongoDB para sa server settings

## 📝 Commands (w! prefix)

### Music Commands
- `w!play <kanta>` - Magtugtugan na! (aliases: p, tugtog, tugtugin)
- `w!skip` - Skip yung kanta (aliases: s, laktaw, lipat)
- `w!stop` - Tapos na, alis na! (aliases: dc, alis, tigil)
- `w!pause` - Pause muna, pahinga! (aliases: sandali, hinto)
- `w!resume` - Tuloy ang laban! (aliases: r, tuloy)
- `w!queue` - Tingnan yung pila (aliases: q, pila, listahan)
- `w!nowplaying` - Ano ba tumutugtog? (aliases: np, ngayon, anoyan)
- `w!volume <1-100>` - Ayusin yung lakas (aliases: vol, v, lakas)
- `w!loop <off/track/queue>` - Ulit-ulitin! (aliases: repeat, ulit)
- `w!shuffle` - Ihalo yung pila (aliases: mix, sh, halo)
- `w!join` - Pasali ako sa VC! (aliases: halika, tara)

### 🎤 Voice Commands (NEW!)
- `w!listen` - Makikinig na ako sa boses mo! (aliases: makinig, dinig)
- `w!unlisten` - Tigil muna pakikinig. (aliases: stoplisten)
- **Voice Usage**: Say **"play [song]"** or **"tugtugin [song]"** habang nakikinig ang bot!


### Info Commands
- `w!ping` - Check kung mabilis ba ako!
- `w!help` - Listahan ng commands (aliases: h, tulong, commands)

## 🚀 Setup Guide

### Requirements
- Node.js 18+ 
- Discord Bot Token
- MongoDB Database
- Lavalink Server (default server provided)

### Installation

1. **Clone this repo**
```bash
git clone <your-repo-url>
cd weedify-bot
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
Copy `.env.example` to `.env` and fill in your details:
```env
TOKEN=your_discord_bot_token_here
MONGODB_URI=your_mongodb_uri_here
BOT_PREFIX=w!
```

## Keep Bot Always Online (Free Method)

The bot now includes a built-in HTTP server with health check endpoints!

### 1. Built-in Self-Ping
The bot automatically pings itself every 14 minutes to prevent Render from sleeping.
- **Requirement**: Set `RENDER_EXTERNAL_URL` in your environment variables to your app's URL.

### 2. External Health Checks (CRITICAL)
Use a service like **UptimeRobot** or **Cron-Job.org** to ping your bot every 14 minutes:
1. Get your Render service URL (e.g., `https://weedify-bot.onrender.com`)
2. Set up a monitor to ping `https://weedify-bot.onrender.com/ping` every 14 minutes
3. This keeps your bot active on the free tier

**Health Check Endpoints:**
- `/` - Main page showing bot status
- `/health` - Detailed health information
- `/ping` - Simple ping endpoint for monitors
- `/ready` - Render readiness check

## 🎤 NEW: Voice Recognition Setup
Weedify now supports **Voice-to-Text Song Requests** using Groq Whisper!

### Configuration
Add these environment variables:
- `GROQ_API_KEY` - Your Groq API key
- `SPEECH_METHOD` - Set to `groq`
- `VOICE_LANGUAGE` - e.g., `en` or `tl`

### Commands
- `w!listen` - Start listening for voice commands
- `w!unlisten` - Stop listening
- `/listen` - Slash command version

**How to use:** Say **"play [song name]"** or **"tugtugin [song name]"** while the bot is listening!

---
**🌿 Weedify Bot - Day One Vibes!**

4. **Get your Discord Bot Token**
- Go to [Discord Developer Portal](https://discord.com/developers/applications)
- Create a new application
- Go to "Bot" section and click "Reset Token"
- Copy the token and paste it in your `.env` file

5. **Get MongoDB URI**
- Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a free cluster
- Get your connection string
- Paste it in your `.env` file

6. **Run the bot**
```bash
node index.js
```

## 🎮 Invite the Bot

Generate an invite link from Discord Developer Portal with these permissions:
- Read Messages/View Channels
- Send Messages
- Embed Links
- Connect
- Speak
- Use Slash Commands

Minimum permission integer: `37088320`

## ⚙️ Configuration

Edit `config.js` to customize:
- Bot prefix (default: `w!`)
- Embed colors
- Owner IDs
- Lavalink settings
- Feature toggles

## 🔧 Lavalink Setup (Optional)

The bot comes with a default Lavalink server. To use your own:
1. Download [Lavalink](https://github.com/lavalink-devs/Lavalink/releases)
2. Update Lavalink settings in `.env`:
```env
LAVALINK_HOST=your_host
LAVALINK_PORT=your_port
LAVALINK_PASSWORD=your_password
```

## 📚 Tech Stack

- **Discord.js v14** - Discord API wrapper
- **Riffy** - Lavalink client
- **MongoDB/Mongoose** - Database
- **Express** - Web server
- **dotenv** - Environment variables

## 🤝 Support

Need help? Create an issue or join our Discord server!

## 📄 License

This project is licensed under the MIT License.

## 🎉 Credits

**Developed by Mason Calix**  
Weedify Music Bot - Ang Pinakamaangas na Music Bot with Tagalog commands!

---

**Weedify - Tumugtog na mga par! 🔥🎵**

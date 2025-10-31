# 🚀 How to Deploy Weedify Bot to Render

## Prerequisites
1. A Render account (free tier available at https://render.com)
2. Your Discord bot token
3. MongoDB URI (you can use MongoDB Atlas free tier)
4. Genius API key (get from https://genius.com/api-clients)

## Step 1: Upload Your Code to GitHub

1. Create a new repository on GitHub
2. Extract the `weedify-bot.tar.gz` file
3. Push all files to your GitHub repository:
   ```bash
   tar -xzf weedify-bot.tar.gz
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

## Step 2: Create a Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `weedify-bot` (or any name you want)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node main.js`
   - **Plan**: Free (or paid if you need always-on)
   - **Health Check Path**: `/health` (optional but recommended)

## Step 3: Set Environment Variables

In the Render dashboard, add these environment variables:

| Key | Value | Description |
|-----|-------|-------------|
| `TOKEN` | Your Discord bot token | Get from Discord Developer Portal |
| `MONGODB_URI` | Your MongoDB connection string | From MongoDB Atlas |
| `GENIUS_API_KEY` | Your Genius API key | From https://genius.com/api-clients |
| `BOT_PREFIX` | `w!` | Optional (default is w!) |

**Important Environment Variables:**
- `TOKEN` - **REQUIRED** - Your Discord bot token
- `MONGODB_URI` - **REQUIRED** - MongoDB connection string
- `GENIUS_API_KEY` - **REQUIRED** - For lyrics feature

**Optional Variables:**
- `LAVALINK_HOST` - Custom Lavalink server (default: lava-all.ajieblogs.eu.org)
- `LAVALINK_PORT` - Lavalink port (default: 443)
- `LAVALINK_PASSWORD` - Lavalink password (default: https://dsc.gg/ajidevserver)
- `BOT_PREFIX` - Command prefix (default: w!)

## Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Run `npm install`
   - Start your bot with `node index.js`
3. Wait for deployment to complete (usually 2-5 minutes)

## Step 5: Verify Bot is Online

1. Check the Render logs for:
   ```
   ✅ Bot initialization completed successfully
   🎵 Lavalink node connected
   ```
2. Check Discord - your bot should show as online
3. Test a command: `w!ping` or `w!play`

## Troubleshooting

### Bot is offline
- Check Render logs for errors
- Verify all environment variables are set correctly
- Make sure your Discord token is valid

### Music not playing
- Check if Lavalink is connected in logs
- Verify bot has permissions in voice channels
- Try using a different Lavalink server

### Lyrics not working
- Verify `GENIUS_API_KEY` is set correctly
- Check Render logs for API errors

## Important Notes for Render Free Tier

⚠️ **Render Free Tier spins down after 15 minutes of inactivity**
- Bot will go offline when inactive
- Restarts automatically on first request
- Consider upgrading to paid plan for 24/7 uptime

## Keep Bot Always Online (Free Method)

The bot now includes a built-in HTTP server with health check endpoints!

Use a service like **UptimeRobot** or **Cron-Job.org** to ping your bot every 14 minutes:
1. Get your Render service URL (e.g., `https://weedify-bot.onrender.com`)
2. Set up a monitor to ping `https://weedify-bot.onrender.com/health` every 14 minutes
3. This keeps your bot active on the free tier

**Health Check Endpoints:**
- `/` - Main page showing bot status
- `/health` - Detailed health information (bot status, memory, Lavalink connection)
- `/ping` - Simple ping endpoint for uptime monitors

## Auto-Disconnect Features (NEW!)

The bot now automatically manages connections to save resources:
- **Auto-disconnect after queue ends** - Leaves voice channel when no more songs
- **5-minute idle timeout** - Disconnects if inactive for 5 minutes
- **Automatic Lavalink reconnection** - Reconnects to Lavalink node if connection drops
- **Memory optimization** - Cleans up idle players automatically

**This prevents the "unknown node" error you were experiencing on Render!**

## Support

If you encounter issues:
1. Check Render logs first
2. Verify all environment variables
3. Make sure MongoDB is accessible from Render
4. Ensure Discord bot has proper permissions

---

**🌿 Weedify Bot - Day One Vibes!**

For more help, check the main README.md file.

# Weedify Music Bot

## Overview

Weedify is a Discord music bot that streams high-quality audio from YouTube and other sources using Lavalink. The bot features both traditional prefix commands (w!) and modern slash commands, with a unique "central music system" that allows users to control music by simply typing song names in a designated channel. The bot is written in Tagalog/Filipino with a casual, friendly tone.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Technology Stack

**Runtime Environment:**
- Node.js 18+ with Discord.js v14 for Discord API interactions
- Express.js web server on port 5000 for health checks and basic web interface

**Audio Processing:**
- Riffy audio library for music playback management
- Lavalink server (external) for high-quality audio streaming and transcoding
- Default Lavalink host: lava-all.ajieblogs.eu.org:443 (HTTPS enabled)

**Data Persistence:**
- MongoDB via Mongoose ODM for server configuration storage
- Single Server model schema storing central system setup, auto-VC settings, and bot preferences per guild

### Bot Architecture

**Command System:**
The bot implements a triple command pattern:
1. **Prefix Commands** - Traditional text commands with `w!` prefix (e.g., `w!play`, `w!skip`)
2. **Slash Commands** - Discord's native slash command system (`/play`, `/queue`)
3. **Mention Commands** - Commands triggered by mentioning the bot

All three command types share common business logic through utility classes, ensuring consistent behavior across interfaces.

**Central Music System:**
A unique feature allowing users to control music without traditional commands. When enabled:
- Admins set up a designated text channel with an embedded control panel
- Users type song names/URLs directly in the channel (no prefix required)
- Bot automatically processes these as music requests
- Optional voice channel binding restricts playback to specific VC
- Role-based permissions control who can use the system

**Player Management:**
- PlayerHandler utility class manages Riffy player lifecycle
- Players are created per-guild with voice/text channel binding
- Queue system supports track queueing, shuffling, looping (track/queue modes)
- Volume control ranges from 1-100%
- Automatic player cleanup when voice channels empty

### Event-Driven Architecture

**Core Events:**
- `ready` - Bot initialization, command registration, central embed deployment
- `messageCreate` - Handles prefix/mention commands and central system song requests
- `interactionCreate` - Processes slash commands and button interactions

**Player Events (Riffy):**
- Track start/end events for queue progression
- Error handling for playback failures
- Voice state updates for connection management

### Utility Systems

**Condition Checking:**
ConditionChecker class validates music command preconditions:
- User voice channel presence
- Bot-user voice channel matching
- Active player existence
- Central system configuration state
- Permission validation

**Embed Management:**
- EmbedUtils provides standardized embed creation (success/error/music)
- CentralEmbedHandler manages the persistent control panel embed
- Dynamic embed updates for now-playing information

**Status Management:**
StatusManager synchronizes bot presence with current playback:
- Updates Discord activity to show currently playing track
- Manages voice channel status (when supported)
- Periodic status rotation when idle

**Memory Management:**
GarbageCollector utility implements:
- Periodic garbage collection every 10 minutes
- Memory usage monitoring with automatic cleanup at 150MB threshold
- Manual cleanup command for administrators

### Configuration System

Centralized config.js with environment variable fallbacks:
- Discord bot token
- MongoDB connection URI
- Lavalink server credentials (host, port, password, SSL)
- Bot preferences (prefix, owner IDs, embed colors)
- Feature flags (autoplay, central system, auto-VC creation, status updates)

### Database Schema

**Server Model:**
- `_id`: Guild ID (string, not ObjectId)
- `centralSetup`: Object containing enabled flag, channel IDs, embed ID, voice channel binding, allowed roles
- `autoVcSetup`: Auto voice channel creation settings (disabled by default)
- `settings`: Per-guild preferences including custom prefix, autoplay toggle, default volume, DJ role

### Security & Permissions

**License Restrictions:**
AGPL-3.0 with custom no-selling clause prohibiting commercial use or derivative sales. Credits must be maintained.

**Permission Checks:**
- Admin commands require ManageChannels permission
- Music commands validate voice channel join permissions
- Central system enforces optional role-based access control
- Owner-only commands (cleanup) check against hardcoded owner ID list

### Error Handling

ErrorHandler utility provides:
- Centralized error logging with context information
- Safe execution wrapper for async operations with fallbacks
- Production/development mode logging (stack traces only in dev)
- Safe Discord reaction handling to prevent uncaught rejections

### Performance Optimizations

- Garbage collection monitoring and forced cleanup
- Player cleanup on inactivity
- Message content caching disabled for memory efficiency
- Queue pagination to prevent embed overflow (15 songs per page)
- Lazy loading of audio tracks from Lavalink

### Deployment Considerations

**Required Environment Variables:**
- `TOKEN` - Discord bot token
- `MONGODB_URI` - MongoDB connection string
- `LAVALINK_HOST`, `LAVALINK_PORT`, `LAVALINK_PASSWORD` - Audio server credentials (defaults provided)

**Scaling Limitations:**
- Single Lavalink node configuration (no load balancing)
- In-memory queue storage (not persistent across restarts)
- Central system limited to one setup per guild

## External Dependencies

**Discord Services:**
- Discord.js v14 library for bot-Discord communication
- Discord Gateway WebSocket connection for real-time events
- Discord REST API for slash command registration

**Audio Infrastructure:**
- External Lavalink server (lava-all.ajieblogs.eu.org) for audio processing
- YouTube as primary audio source (free version limitation)
- Riffy library as Lavalink client wrapper

**Database:**
- MongoDB for persistent server configuration storage
- Mongoose ODM for schema validation and queries

**Web Services:**
- Express.js for basic HTTP health endpoint
- genius-lyrics-api dependency (installed but unused in visible code)

**Node.js Built-ins:**
- fs/path for file system operations (command loading)
- crypto for cryptographic operations
- process for environment variables and graceful shutdown
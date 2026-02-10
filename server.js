const express = require('express');
const fs = require('fs');
const path = require('path');

function createServer(client) {
    const app = express();
    const PORT = process.env.PORT || 3000;
    
    // Self-ping interval for keeping Render alive
    const SELF_PING_ENABLED = process.env.SELF_PING_ENABLED !== 'false';
    const SELF_PING_INTERVAL = parseInt(process.env.SELF_PING_INTERVAL) || 840000; // 14 minutes
    const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || process.env.RENDER_EXTERNAL_URL;

    app.use(express.json());
    
    // Request logging middleware
    app.use((req, res, next) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
        next();
    });

    app.get('/', (req, res) => {
        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Weedify Music Bot</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                    }
                    .container {
                        text-align: center;
                        background: rgba(0,0,0,0.3);
                        padding: 40px;
                        border-radius: 20px;
                    }
                    h1 { margin-bottom: 10px; }
                    .status { 
                        color: #4ade80;
                        font-size: 1.2em;
                        margin: 20px 0;
                    }
                    .feature {
                        background: rgba(255,255,255,0.1);
                        padding: 10px;
                        margin: 10px 0;
                        border-radius: 8px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🎵 Weedify Music Bot</h1>
                    <p class="status">✅ Bot is Online and Running!</p>
                    <p>Use w!play or /play to enjoy music!</p>
                    <div class="feature">
                        <strong>🎤 NEW: Voice Request Feature!</strong><br>
                        Say "play [song]" in voice chat after using w!listen
                    </div>
                    <p style="margin-top: 20px; font-size: 0.9em; opacity: 0.7;">
                        Uptime: ${Math.floor(process.uptime() / 60)} minutes
                    </p>
                </div>
            </body>
            </html>
        `);
    });

    // Enhanced health check endpoint
    app.get('/health', (req, res) => {
        const health = {
            status: 'ok',
            uptime: process.uptime(),
            timestamp: Date.now(),
            bot: {
                connected: client.isReady(),
                guilds: client.guilds.cache.size,
                users: client.users.cache.size,
                ping: client.ws.ping
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
            },
            lavalink: {
                connected: client.riffy?.nodes?.size > 0,
                nodes: client.riffy?.nodes?.size || 0
            },
            voice: {
                connections: client.riffy?.players?.size || 0
            }
        };
        
        res.status(200).json(health);
    });

    // Simple ping endpoint for UptimeRobot
    app.get('/ping', (req, res) => {
        res.status(200).json({ 
            message: 'pong', 
            timestamp: Date.now(),
            uptime: process.uptime()
        });
    });
    
    // Ready endpoint for Render health checks
    app.get('/ready', (req, res) => {
        if (client.isReady()) {
            res.status(200).json({ ready: true });
        } else {
            res.status(503).json({ ready: false });
        }
    });

    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🌐 HTTP server running on port ${PORT}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/health`);
        console.log(`🔗 Ping endpoint: http://localhost:${PORT}/ping`);
        
        // Start self-ping keepalive if enabled
        if (SELF_PING_ENABLED && RENDER_EXTERNAL_URL) {
            console.log(`⏰ Self-ping keepalive enabled (every ${SELF_PING_INTERVAL / 1000 / 60} minutes)`);
            startSelfPing();
        } else if (SELF_PING_ENABLED) {
            console.log(`⚠️ Self-ping enabled but RENDER_EXTERNAL_URL not set. Please set it in .env`);
        }
    });
    
    // Self-ping function to keep Render server alive
    function startSelfPing() {
        setInterval(async () => {
            try {
                const url = `${RENDER_EXTERNAL_URL}/ping`;
                const response = await fetch(url);
                if (response.ok) {
                    console.log(`✅ Self-ping keepalive successful`);
                } else {
                    console.warn(`⚠️ Self-ping returned status ${response.status}`);
                }
            } catch (error) {
                console.error(`❌ Self-ping failed:`, error.message);
            }
        }, SELF_PING_INTERVAL);
    }

    return app;
}

module.exports = createServer;


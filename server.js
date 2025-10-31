const express = require('express');
const fs = require('fs');
const path = require('path');

function createServer(client) {
    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(express.json());

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
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🎵 Weedify Music Bot</h1>
                    <p class="status">✅ Bot is Online and Running!</p>
                    <p>Use w!play or /play to enjoy music!</p>
                </div>
            </body>
            </html>
        `);
    });

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
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
            },
            lavalink: {
                connected: client.riffy?.nodes?.size > 0
            }
        };
        
        res.status(200).json(health);
    });

    app.get('/ping', (req, res) => {
        res.status(200).json({ 
            message: 'pong', 
            timestamp: Date.now(),
            uptime: process.uptime()
        });
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🌐 HTTP server running on port ${PORT}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

    return app;
}

module.exports = createServer;

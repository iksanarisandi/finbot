/**
 * Application entry point
 * FinBot - Telegram Financial Bot
 */

require('dotenv').config();

const express = require('express');
const { createBot } = require('./bot');

// Validate required environment variables
const requiredEnvVars = ['BOT_TOKEN', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_DOMAIN = process.env.WEBHOOK_DOMAIN;
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/webhook';
const PORT = parseInt(process.env.PORT || '3000', 10);

// Create bot instance
const bot = createBot(BOT_TOKEN);

// Create Express app for webhook
const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'FinBot',
        description: 'Telegram Financial Bot',
        status: 'running'
    });
});

/**
 * Start the bot
 */
async function start() {
    try {
        // Check if we should use webhook or polling
        if (WEBHOOK_DOMAIN) {
            // Webhook mode (production)
            const webhookUrl = `${WEBHOOK_DOMAIN}${WEBHOOK_PATH}`;

            console.log(`Setting webhook to: ${webhookUrl}`);

            // Set webhook
            await bot.telegram.setWebhook(webhookUrl);

            // Use webhook
            app.use(bot.webhookCallback(WEBHOOK_PATH));

            // Start Express server
            app.listen(PORT, () => {
                console.log(`🚀 FinBot started in webhook mode`);
                console.log(`📡 Webhook: ${webhookUrl}`);
                console.log(`🌐 Server listening on port ${PORT}`);
            });
        } else {
            // Polling mode (development)
            console.log('Starting in polling mode (no WEBHOOK_DOMAIN set)');

            // Delete any existing webhook
            await bot.telegram.deleteWebhook();

            // Start Express server for health checks
            app.listen(PORT, () => {
                console.log(`🌐 Health check server listening on port ${PORT}`);
            });

            // Start polling
            await bot.launch();
            console.log('🚀 FinBot started in polling mode');
        }

        // Get bot info
        const botInfo = await bot.telegram.getMe();
        console.log(`🤖 Bot: @${botInfo.username}`);
        console.log(`📝 Admin IDs: ${process.env.ADMIN_IDS || 'not set'}`);

    } catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('Received SIGINT, shutting down...');
    bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down...');
    bot.stop('SIGTERM');
});

// Start the application
start();

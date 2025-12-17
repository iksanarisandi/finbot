/**
 * Application entry point with enhanced security
 * FinBot - Telegram Financial Bot
 */

require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const { createBot } = require('./bot');
const { scheduleReminder } = require('./services/reminderService');

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

const requiredEnvVars = ['BOT_TOKEN', 'DATABASE_URL', 'ADMIN_IDS'];
const optionalEnvVars = ['WEBHOOK_DOMAIN', 'WEBHOOK_SECRET', 'PORT'];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

// Validate BOT_TOKEN format
if (!/^\d+:[A-Za-z0-9_-]{35,}$/.test(process.env.BOT_TOKEN)) {
    console.error('❌ Invalid BOT_TOKEN format');
    process.exit(1);
}

// Validate ADMIN_IDS format
const adminIds = process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim(), 10));
if (adminIds.some(id => isNaN(id) || id <= 0)) {
    console.error('❌ Invalid ADMIN_IDS format. Must be comma-separated integers.');
    process.exit(1);
}

console.log('✅ Environment variables validated');

// ============================================
// CONFIGURATION
// ============================================

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_DOMAIN = process.env.WEBHOOK_DOMAIN;
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/webhook';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || crypto.randomBytes(32).toString('hex');
const PORT = parseInt(process.env.PORT || '3000', 10);

// Create bot instance
const bot = createBot(BOT_TOKEN);

// Create Express app for webhook
const app = express();

// ============================================
// SECURITY HEADERS MIDDLEWARE
// ============================================

app.use((req, res, next) => {
    // Remove server fingerprint
    res.removeHeader('X-Powered-By');

    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    next();
});

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
    res.status(200).send('OK');
});

// Block suspicious paths
app.use((req, res, next) => {
    const suspiciousPaths = [
        '/admin', '/wp-admin', '/login', '/.env',
        '/config', '/phpmyadmin', '/.git'
    ];

    if (suspiciousPaths.some(path => req.path.toLowerCase().includes(path))) {
        console.log(`[SECURITY] Blocked suspicious request: ${req.path} from ${req.ip}`);
        return res.status(404).send('Not found');
    }

    next();
});

// ============================================
// START BOT
// ============================================

async function start() {
    try {
        if (WEBHOOK_DOMAIN) {
            // =========================================
            // WEBHOOK MODE (Production)
            // =========================================

            const webhookUrl = `${WEBHOOK_DOMAIN}${WEBHOOK_PATH}`;
            const useSecret = !!process.env.WEBHOOK_SECRET;

            console.log(`📡 Setting webhook to: ${webhookUrl}`);

            // Set webhook (with or without secret)
            if (useSecret) {
                await bot.telegram.setWebhook(webhookUrl, {
                    secret_token: WEBHOOK_SECRET
                });
            } else {
                await bot.telegram.setWebhook(webhookUrl);
            }

            // Webhook handler
            app.post(WEBHOOK_PATH, express.json(), (req, res, next) => {
                // Only verify secret if it's explicitly configured
                if (useSecret) {
                    const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
                    if (secretHeader !== WEBHOOK_SECRET) {
                        console.log(`[SECURITY] Invalid webhook secret from ${req.ip}`);
                        return res.status(401).send('Unauthorized');
                    }
                }

                next();
            }, (req, res) => {
                return bot.handleUpdate(req.body, res);
            });

            // Start Express server
            app.listen(PORT, () => {
                console.log(`🚀 FinBot started in webhook mode`);
                console.log(`📡 Webhook: ${webhookUrl}`);
                console.log(`🔒 Webhook secret: ${useSecret ? 'Enabled' : 'Disabled'}`);
                console.log(`🌐 Server listening on port ${PORT}`);
            });

        } else {
            // =========================================
            // POLLING MODE (Development)
            // =========================================

            console.log('⚠️  Starting in polling mode (no WEBHOOK_DOMAIN set)');

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
        console.log(`👤 Admin IDs: ${process.env.ADMIN_IDS}`);
        console.log(`🛡️  Security: Enabled`);

        // Start reminder scheduler
        scheduleReminder(bot);

    } catch (error) {
        console.error('❌ Failed to start bot:', error);
        process.exit(1);
    }
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    bot.stop(signal);
    process.exit(0);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit, just log
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit, just log
});

// Start the application
start();

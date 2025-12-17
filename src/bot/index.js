/**
 * Bot initialization and setup with enhanced security
 */

const { Telegraf } = require('telegraf');

// Import commands
const startCommand = require('./commands/start');
const helpCommand = require('./commands/help');
const todayCommand = require('./commands/today');
const weekCommand = require('./commands/week');
const monthCommand = require('./commands/month');
const historyCommand = require('./commands/history');
const { deleteCommand, handleDeleteConfirm, handleDeleteCancel } = require('./commands/delete');
const planCommand = require('./commands/plan');
const upgradeCommand = require('./commands/upgrade');
const statusCommand = require('./commands/status');
const reminderCommand = require('./commands/reminder');

// Import admin commands
const { confirmCommand } = require('./commands/admin/confirm');
const { rejectCommand } = require('./commands/admin/reject');
const { statsCommand } = require('./commands/admin/stats');
const { downgradeCommand } = require('./commands/admin/downgrade');
const { testReminderCommand } = require('./commands/admin/testReminder');

// Import handlers
const { handleTransaction, handleUpgradePrompt } = require('./handlers/transaction');
const { handlePhoto, handleDocument } = require('./handlers/photo');

// Import security middleware
const {
    securityMiddleware,
    requireAdmin,
    rateLimitMiddleware
} = require('../middleware/security');

/**
 * Initialize and configure the bot
 * @param {string} token - Bot token
 * @returns {Telegraf} - Configured bot instance
 */
function createBot(token) {
    const bot = new Telegraf(token);

    // Error handling
    bot.catch((err, ctx) => {
        console.error(`Error for ${ctx.updateType}:`, err);
        ctx.reply('Maaf terjadi kesalahan. Coba lagi nanti.').catch(() => { });
    });

    // =========================================
    // GLOBAL SECURITY MIDDLEWARE (FIRST!)
    // =========================================
    bot.use(securityMiddleware);

    // =========================================
    // USER COMMANDS
    // =========================================

    // Basic commands with rate limiting
    bot.command('start', rateLimitMiddleware('start'), startCommand);
    bot.command('help', helpCommand);

    // Report commands
    bot.command('today', rateLimitMiddleware('month'), todayCommand);
    bot.command('week', rateLimitMiddleware('month'), weekCommand);
    bot.command('month', rateLimitMiddleware('month'), monthCommand);

    // Transaction management
    bot.command('history', rateLimitMiddleware('history'), historyCommand);
    bot.command('delete', rateLimitMiddleware('delete'), deleteCommand);

    // Subscription commands
    bot.command('plan', planCommand);
    bot.command('upgrade', rateLimitMiddleware('upgrade'), upgradeCommand);
    bot.command('status', statusCommand);
    bot.command('reminder', reminderCommand);

    // =========================================
    // ADMIN COMMANDS (Protected)
    // =========================================
    bot.command('confirm', requireAdmin, (ctx) => confirmCommand(ctx, bot));
    bot.command('reject', requireAdmin, (ctx) => rejectCommand(ctx, bot));
    bot.command('stats', requireAdmin, statsCommand);
    bot.command('downgrade', requireAdmin, (ctx) => downgradeCommand(ctx, bot));
    bot.command('testreminder', requireAdmin, (ctx) => testReminderCommand(ctx, bot));

    // =========================================
    // CALLBACK HANDLERS
    // =========================================
    bot.action(/^delete_confirm:/, handleDeleteConfirm);
    bot.action('delete_cancel', handleDeleteCancel);
    bot.action('upgrade_prompt', handleUpgradePrompt);

    // =========================================
    // MESSAGE HANDLERS
    // =========================================

    // Photo/document handler (payment proof)
    bot.on('photo', (ctx) => handlePhoto(ctx, bot));
    bot.on('document', (ctx) => handleDocument(ctx, bot));

    // Text handler (transactions) - Applied last as catch-all
    bot.on('text', handleTransaction);

    return bot;
}

module.exports = { createBot };

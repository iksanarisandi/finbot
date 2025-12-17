/**
 * Bot initialization and setup
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

// Import admin commands
const { confirmCommand } = require('./commands/admin/confirm');
const { rejectCommand } = require('./commands/admin/reject');
const { statsCommand } = require('./commands/admin/stats');
const { downgradeCommand } = require('./commands/admin/downgrade');

// Import handlers
const { handleTransaction, handleUpgradePrompt } = require('./handlers/transaction');
const { handlePhoto, handleDocument } = require('./handlers/photo');

// Import middleware
const { requireAdmin } = require('../middleware/auth');
const { rateLimitMiddleware } = require('../middleware/rateLimit');

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

    // User commands
    bot.command('start', startCommand);
    bot.command('help', helpCommand);
    bot.command('today', rateLimitMiddleware('month'), todayCommand);
    bot.command('week', rateLimitMiddleware('month'), weekCommand);
    bot.command('month', rateLimitMiddleware('month'), monthCommand);
    bot.command('history', rateLimitMiddleware('history'), historyCommand);
    bot.command('delete', deleteCommand);
    bot.command('plan', planCommand);
    bot.command('upgrade', rateLimitMiddleware('upgrade'), upgradeCommand);
    bot.command('status', statusCommand);

    // Admin commands
    bot.command('confirm', requireAdmin, (ctx) => confirmCommand(ctx, bot));
    bot.command('reject', requireAdmin, (ctx) => rejectCommand(ctx, bot));
    bot.command('stats', requireAdmin, statsCommand);
    bot.command('downgrade', requireAdmin, (ctx) => downgradeCommand(ctx, bot));

    // Callback handlers
    bot.action(/^delete_confirm:/, handleDeleteConfirm);
    bot.action('delete_cancel', handleDeleteCancel);
    bot.action('upgrade_prompt', handleUpgradePrompt);

    // Photo/document handler (payment proof)
    bot.on('photo', (ctx) => handlePhoto(ctx, bot));
    bot.on('document', (ctx) => handleDocument(ctx, bot));

    // Text handler (transactions)
    bot.on('text', handleTransaction);

    return bot;
}

module.exports = { createBot };

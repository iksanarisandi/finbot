/**
 * Transaction handler - Parse and save transactions from natural language
 */

const { parseTransaction, validateTransaction } = require('../../utils/parser');
const { getUserByTelegramId, checkTransactionLimit } = require('../../services/userService');
const { createTransaction } = require('../../services/transactionService');
const { formatNumber, formatDate } = require('../../utils/formatter');
const { errorMessages, transactionConfirmMessage } = require('../../utils/messages');
const { checkRateLimit } = require('../../middleware/rateLimit');
const { Markup } = require('telegraf');

/**
 * Handle text messages that might be transactions
 * @param {Object} ctx - Telegraf context
 */
async function handleTransaction(ctx) {
    const text = ctx.message?.text;

    // Skip if no text or is a command
    if (!text || text.startsWith('/')) {
        return;
    }

    try {
        // Get user
        const user = await getUserByTelegramId(ctx.from.id);

        if (!user) {
            await ctx.reply('Kirim /start terlebih dahulu untuk mendaftar.');
            return;
        }

        // Rate limit check
        if (!checkRateLimit(ctx.from.id, 'transaction', 20, 3600000)) {
            await ctx.reply('⏳ Terlalu banyak transaksi. Tunggu 1 jam.');
            return;
        }

        // Parse transaction
        const parsed = parseTransaction(text);
        const validation = validateTransaction(parsed);

        if (!validation.valid) {
            const errorMsg = errorMessages[validation.error] || errorMessages.PARSE_ERROR;
            await ctx.reply(errorMsg);
            return;
        }

        // Check limit
        const limitStatus = await checkTransactionLimit(user);

        if (!limitStatus.allowed) {
            const message = errorMessages.LIMIT_EXCEEDED
                .replace('{current}', limitStatus.current.toString())
                .replace('{limit}', limitStatus.limit.toString());

            await ctx.reply(message, {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    Markup.button.callback('⭐️ Upgrade ke Pro', 'upgrade_prompt')
                ])
            });
            return;
        }

        // Create transaction
        const transaction = await createTransaction(user, parsed);

        // Get updated limit status
        const newLimitStatus = await checkTransactionLimit(user);

        // Format confirmation message
        const emoji = parsed.type === 'income' ? '💰' : '💸';
        const sign = parsed.type === 'income' ? '+' : '';

        const message = transactionConfirmMessage
            .replace('{seq}', transaction.seq.toString())
            .replace('{amount}', `${sign}${formatNumber(Number(transaction.amount))}`)
            .replace('{description}', parsed.description.charAt(0).toUpperCase() + parsed.description.slice(1))
            .replace('{date}', formatDate(transaction.date, user.timezone))
            .replace('{used}', newLimitStatus.current.toString())
            .replace('{limit}', newLimitStatus.limit.toString());

        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error handling transaction:', error);
        await ctx.reply(errorMessages.DB_ERROR);
    }
}

/**
 * Handle upgrade prompt callback
 */
async function handleUpgradePrompt(ctx) {
    try {
        await ctx.answerCbQuery();
        // Trigger upgrade command
        ctx.message = { text: '/upgrade' };
        const upgradeCommand = require('../commands/upgrade');
        await upgradeCommand(ctx);
    } catch (error) {
        console.error('Error in upgrade prompt:', error);
        await ctx.answerCbQuery('Gunakan /upgrade untuk upgrade.');
    }
}

module.exports = {
    handleTransaction,
    handleUpgradePrompt
};

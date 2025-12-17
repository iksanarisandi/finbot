/**
 * /start command handler
 */

const { findOrCreateUser, checkTransactionLimit } = require('../../services/userService');
const { welcomeMessage, welcomeBackMessage } = require('../../utils/messages');
const { formatDate } = require('../../utils/formatter');

async function startCommand(ctx) {
    try {
        const telegramUser = ctx.from;
        const user = await findOrCreateUser(telegramUser);
        const limitStatus = await checkTransactionLimit(user);

        const isNewUser = (Date.now() - new Date(user.createdAt).getTime()) < 5000;

        let message;
        if (isNewUser) {
            message = welcomeMessage
                .replace('{plan}', user.plan === 'pro' ? '⭐️ PRO' : '🆓 FREE')
                .replace('{used}', limitStatus.current.toString())
                .replace('{limit}', limitStatus.limit.toString());
        } else {
            let expiry = '';
            if (user.plan === 'pro' && user.planExpiredAt) {
                expiry = `📅 Berlaku sampai: ${formatDate(user.planExpiredAt, user.timezone)}`;
            }

            message = welcomeBackMessage
                .replace('{plan}', user.plan === 'pro' ? '⭐️ PRO' : '🆓 FREE')
                .replace('{used}', limitStatus.current.toString())
                .replace('{limit}', limitStatus.limit.toString())
                .replace('{expiry}', expiry);
        }

        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error in /start command:', error);
        await ctx.reply('Maaf terjadi kesalahan. Coba lagi nanti.');
    }
}

module.exports = startCommand;

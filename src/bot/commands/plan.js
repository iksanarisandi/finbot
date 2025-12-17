/**
 * /plan command handler - Show subscription plans
 */

const { getUserByTelegramId } = require('../../services/userService');
const { PRO_PRICE } = require('../../services/paymentService');
const { planInfoMessage } = require('../../utils/messages');
const { formatNumber } = require('../../utils/formatter');

async function planCommand(ctx) {
    try {
        const user = await getUserByTelegramId(ctx.from.id);

        const freeStatus = (!user || user.plan === 'free') ? '*(Aktif)*' : '';
        const proStatus = (user && user.plan === 'pro') ? '*(Aktif)*' : '';

        const message = planInfoMessage
            .replace('{freeStatus}', freeStatus)
            .replace('{proStatus}', proStatus)
            .replace('{price}', formatNumber(PRO_PRICE));

        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error in /plan command:', error);
        await ctx.reply('Gagal mengambil data. Coba lagi.');
    }
}

module.exports = planCommand;

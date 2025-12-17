/**
 * /upgrade command handler - Start upgrade process
 */

const path = require('path');
const fs = require('fs');
const { getUserByTelegramId } = require('../../services/userService');
const { createPaymentRequest, PRO_PRICE } = require('../../services/paymentService');
const { upgradeMessage } = require('../../utils/messages');
const { formatNumber, formatDate } = require('../../utils/formatter');

async function upgradeCommand(ctx) {
    try {
        const user = await getUserByTelegramId(ctx.from.id);

        if (!user) {
            await ctx.reply('Kirim /start terlebih dahulu untuk mendaftar.');
            return;
        }

        // Check if already Pro and not expired
        if (user.plan === 'pro' && user.planExpiredAt && new Date(user.planExpiredAt) > new Date()) {
            const expiry = formatDate(user.planExpiredAt, user.timezone);
            await ctx.reply(`⭐️ Anda sudah Pro sampai *${expiry}*\n\nJika ingin perpanjang, tunggu sampai mendekati masa aktif berakhir.`, { parse_mode: 'Markdown' });
            return;
        }

        // Create payment request
        const paymentRequest = await createPaymentRequest(user.id, 'pro', 1);

        const message = upgradeMessage
            .replace('{price}', formatNumber(PRO_PRICE))
            .replace('{reference}', paymentRequest.referenceCode);

        // Send QRIS image
        const qrisPath = path.join(__dirname, '../../../assets/qris.jpg');

        if (fs.existsSync(qrisPath)) {
            await ctx.replyWithPhoto({ source: qrisPath }, {
                caption: message,
                parse_mode: 'Markdown'
            });
        } else {
            // Fallback if QRIS image not found
            await ctx.reply(message + '\n\n⚠️ _QRIS image tidak tersedia, hubungi admin._', { parse_mode: 'Markdown' });
        }
    } catch (error) {
        console.error('Error in /upgrade command:', error);
        await ctx.reply('Gagal memproses upgrade. Coba lagi.');
    }
}

module.exports = upgradeCommand;

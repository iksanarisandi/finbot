/**
 * /reject command handler - Admin rejects payment
 */

const { requireAdmin } = require('../../../middleware/auth');
const { getUserById } = require('../../../services/userService');
const { rejectPayment, getPendingPaymentRequest } = require('../../../services/paymentService');
const { paymentRejectedMessage } = require('../../../utils/messages');

/**
 * Reject payment command
 * Usage: /reject <user_id> [reason]
 */
async function rejectCommand(ctx, bot) {
    try {
        const args = ctx.message.text.split(' ').slice(1);

        if (args.length < 1) {
            await ctx.reply('Format: /reject <user_id> [alasan]\nContoh: /reject 123 Bukti tidak jelas');
            return;
        }

        const userId = parseInt(args[0], 10);
        const reason = args.slice(1).join(' ') || 'Bukti pembayaran tidak valid';

        // Validate inputs
        if (isNaN(userId) || userId <= 0) {
            await ctx.reply('User ID tidak valid');
            return;
        }

        // Get user
        const user = await getUserById(userId);

        if (!user) {
            await ctx.reply(`User ${userId} tidak ditemukan`);
            return;
        }

        // Check pending payment
        const pendingPayment = await getPendingPaymentRequest(userId);

        if (!pendingPayment) {
            await ctx.reply(`User ${userId} tidak punya pending payment`);
            return;
        }

        // Reject payment
        await rejectPayment(userId, ctx.from.id, reason);

        // Send confirmation to admin
        const adminMessage = `
❌ *Pembayaran Ditolak*

👤 User: ${userId} (@${user.username || 'tidak ada'})
🔖 Referensi: ${pendingPayment.referenceCode}
📝 Alasan: ${reason}

User telah diberitahu.
`;

        await ctx.reply(adminMessage, { parse_mode: 'Markdown' });

        // Notify user
        const userMessage = paymentRejectedMessage
            .replace('{reference}', pendingPayment.referenceCode)
            .replace('{reason}', reason);

        try {
            await bot.telegram.sendMessage(Number(user.telegramId), userMessage, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Failed to notify user:', error);
            await ctx.reply('⚠️ Gagal mengirim notifikasi ke user (mungkin bot diblock)');
        }
    } catch (error) {
        console.error('Error in /reject command:', error);
        await ctx.reply('Gagal menolak pembayaran. Coba lagi.');
    }
}

module.exports = {
    rejectCommand,
    middleware: requireAdmin
};

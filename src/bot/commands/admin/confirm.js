/**
 * /confirm command handler - Admin confirms payment
 */

const { requireAdmin } = require('../../../middleware/auth');
const { getUserById, upgradeUserToPro } = require('../../../services/userService');
const { verifyPayment, getPendingPaymentRequest } = require('../../../services/paymentService');
const { paymentConfirmedMessage } = require('../../../utils/messages');
const { formatDate } = require('../../../utils/formatter');

/**
 * Confirm payment command
 * Usage: /confirm <user_id> pro <duration_months>
 */
async function confirmCommand(ctx, bot) {
    try {
        const args = ctx.message.text.split(' ').slice(1);

        if (args.length < 3) {
            await ctx.reply('Format: /confirm <user_id> pro <durasi_bulan>\nContoh: /confirm 123 pro 1');
            return;
        }

        const userId = parseInt(args[0], 10);
        const plan = args[1].toLowerCase();
        const duration = parseInt(args[2], 10);

        // Validate inputs
        if (isNaN(userId) || userId <= 0) {
            await ctx.reply('User ID tidak valid');
            return;
        }

        if (plan !== 'pro') {
            await ctx.reply('Plan harus "pro"');
            return;
        }

        if (isNaN(duration) || duration <= 0) {
            await ctx.reply('Durasi harus angka positif');
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

        // Verify payment
        await verifyPayment(userId, ctx.from.id);

        // Upgrade user
        const upgradedUser = await upgradeUserToPro(userId, duration, ctx.from.id);

        // Send confirmation to admin
        const adminMessage = `
✅ *Konfirmasi Berhasil*

👤 User: ${userId} (@${user.username || 'tidak ada'})
📋 Plan: PRO
⏱ Durasi: ${duration} bulan
📅 Berlaku sampai: ${formatDate(upgradedUser.planExpiredAt, upgradedUser.timezone)}

User telah diberitahu.
`;

        await ctx.reply(adminMessage, { parse_mode: 'Markdown' });

        // Notify user
        const userMessage = paymentConfirmedMessage
            .replace('{expiryDate}', formatDate(upgradedUser.planExpiredAt, upgradedUser.timezone));

        try {
            await bot.telegram.sendMessage(Number(user.telegramId), userMessage, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Failed to notify user:', error);
            await ctx.reply('⚠️ Gagal mengirim notifikasi ke user (mungkin bot diblock)');
        }
    } catch (error) {
        console.error('Error in /confirm command:', error);
        await ctx.reply('Gagal konfirmasi pembayaran. Coba lagi.');
    }
}

module.exports = {
    confirmCommand,
    middleware: requireAdmin
};

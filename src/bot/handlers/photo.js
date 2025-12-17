/**
 * Photo handler - Handle payment proof uploads
 */

const { getUserByTelegramId } = require('../../services/userService');
const { getPendingPaymentRequest, submitPaymentProof } = require('../../services/paymentService');
const { paymentReceivedMessage } = require('../../utils/messages');
const { checkRateLimit } = require('../../middleware/rateLimit');
const { ADMIN_IDS } = require('../../middleware/auth');

/**
 * Handle photo uploads (payment proof)
 * @param {Object} ctx - Telegraf context
 * @param {Object} bot - Telegraf bot instance
 */
async function handlePhoto(ctx, bot) {
    try {
        const user = await getUserByTelegramId(ctx.from.id);

        if (!user) {
            await ctx.reply('Kirim /start terlebih dahulu untuk mendaftar.');
            return;
        }

        // Rate limit check
        if (!checkRateLimit(ctx.from.id, 'photo', 5, 3600000)) {
            await ctx.reply('⏳ Terlalu banyak upload. Tunggu 1 jam.');
            return;
        }

        // Check for pending payment
        const pendingPayment = await getPendingPaymentRequest(user.id);

        if (!pendingPayment) {
            await ctx.reply('Tidak ada permintaan pembayaran yang aktif.\n\nKirim /upgrade dulu untuk mulai proses pembayaran.');
            return;
        }

        // Get file ID from photo (use largest size)
        const photos = ctx.message.photo;
        const fileId = photos[photos.length - 1].file_id;

        // Update payment request with proof
        await submitPaymentProof(pendingPayment.id, fileId);

        // Send confirmation to user
        const userMessage = paymentReceivedMessage
            .replace('{reference}', pendingPayment.referenceCode);

        await ctx.reply(userMessage, { parse_mode: 'Markdown' });

        // Forward to admin(s)
        const adminMessage = `
💰 *Bukti Pembayaran Baru*

👤 User ID: \`${user.id}\`
📱 Telegram ID: \`${ctx.from.id}\`
👤 Username: @${ctx.from.username || 'tidak ada'}
🔖 Referensi: \`${pendingPayment.referenceCode}\`
📋 Request: Pro - ${pendingPayment.durationMonths} bulan
💵 Amount: Rp ${pendingPayment.amount.toLocaleString('id-ID')}

✅ Konfirmasi: \`/confirm ${user.id} pro ${pendingPayment.durationMonths}\`
❌ Tolak: \`/reject ${user.id} [alasan]\`
`;

        // Forward photo and message to all admins
        for (const adminId of ADMIN_IDS) {
            try {
                await bot.telegram.sendPhoto(adminId, fileId, {
                    caption: adminMessage,
                    parse_mode: 'Markdown'
                });
            } catch (error) {
                console.error(`Failed to notify admin ${adminId}:`, error);
            }
        }
    } catch (error) {
        console.error('Error handling photo:', error);
        await ctx.reply('Gagal memproses foto. Coba lagi.');
    }
}

/**
 * Handle document uploads (payment proof as document)
 */
async function handleDocument(ctx, bot) {
    try {
        const document = ctx.message.document;

        // Check if it's an image
        if (!document.mime_type?.startsWith('image/')) {
            await ctx.reply('Kirim bukti pembayaran dalam format gambar (jpg, png).');
            return;
        }

        // Check file size (max 5MB)
        if (document.file_size > 5 * 1024 * 1024) {
            await ctx.reply('File terlalu besar. Kirim screenshot dengan ukuran lebih kecil (max 5MB).');
            return;
        }

        // Process similar to photo
        const user = await getUserByTelegramId(ctx.from.id);

        if (!user) {
            await ctx.reply('Kirim /start terlebih dahulu untuk mendaftar.');
            return;
        }

        const pendingPayment = await getPendingPaymentRequest(user.id);

        if (!pendingPayment) {
            await ctx.reply('Tidak ada permintaan pembayaran yang aktif.\n\nKirim /upgrade dulu untuk mulai proses pembayaran.');
            return;
        }

        // Update payment request with proof
        await submitPaymentProof(pendingPayment.id, document.file_id);

        // Send confirmation
        const userMessage = paymentReceivedMessage
            .replace('{reference}', pendingPayment.referenceCode);

        await ctx.reply(userMessage, { parse_mode: 'Markdown' });

        // Forward to admins
        const adminMessage = `
💰 *Bukti Pembayaran Baru*

👤 User ID: \`${user.id}\`
📱 Telegram ID: \`${ctx.from.id}\`
👤 Username: @${ctx.from.username || 'tidak ada'}
🔖 Referensi: \`${pendingPayment.referenceCode}\`
📋 Request: Pro - ${pendingPayment.durationMonths} bulan
💵 Amount: Rp ${pendingPayment.amount.toLocaleString('id-ID')}

✅ Konfirmasi: \`/confirm ${user.id} pro ${pendingPayment.durationMonths}\`
❌ Tolak: \`/reject ${user.id} [alasan]\`
`;

        for (const adminId of ADMIN_IDS) {
            try {
                await bot.telegram.sendDocument(adminId, document.file_id, {
                    caption: adminMessage,
                    parse_mode: 'Markdown'
                });
            } catch (error) {
                console.error(`Failed to notify admin ${adminId}:`, error);
            }
        }
    } catch (error) {
        console.error('Error handling document:', error);
        await ctx.reply('Gagal memproses file. Coba lagi.');
    }
}

module.exports = {
    handlePhoto,
    handleDocument
};

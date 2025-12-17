/**
 * /downgrade command handler - Admin downgrades user to Free
 */

const { requireAdmin } = require('../../../middleware/auth');
const { getUserById, downgradeUserToFree } = require('../../../services/userService');

/**
 * Downgrade command
 * Usage: /downgrade <user_id>
 */
async function downgradeCommand(ctx, bot) {
    try {
        const args = ctx.message.text.split(' ').slice(1);

        if (args.length < 1) {
            await ctx.reply('Format: /downgrade <user_id>\nContoh: /downgrade 123');
            return;
        }

        const userId = parseInt(args[0], 10);

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

        // Downgrade user
        await downgradeUserToFree(userId, ctx.from.id);

        // Send confirmation to admin
        const adminMessage = `
✅ *User Downgraded*

👤 User: ${userId} (@${user.username || 'tidak ada'})
📋 Plan: FREE (15 catatan/bulan)

User telah diberitahu.
`;

        await ctx.reply(adminMessage, { parse_mode: 'Markdown' });

        // Notify user
        const userMessage = `
ℹ️ *Status Akun Diubah*

Paket Anda telah diubah ke *FREE*.
Limit: 15 catatan/bulan

Upgrade kembali: /upgrade
`;

        try {
            await bot.telegram.sendMessage(Number(user.telegramId), userMessage, { parse_mode: 'Markdown' });
        } catch (error) {
            console.error('Failed to notify user:', error);
            await ctx.reply('⚠️ Gagal mengirim notifikasi ke user (mungkin bot diblock)');
        }
    } catch (error) {
        console.error('Error in /downgrade command:', error);
        await ctx.reply('Gagal downgrade user. Coba lagi.');
    }
}

module.exports = {
    downgradeCommand,
    middleware: requireAdmin
};

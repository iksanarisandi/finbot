/**
 * /status command handler - Show account status
 */

const { getUserByTelegramId, checkTransactionLimit } = require('../../services/userService');
const { formatDate } = require('../../utils/formatter');

async function statusCommand(ctx) {
    try {
        const user = await getUserByTelegramId(ctx.from.id);

        if (!user) {
            await ctx.reply('Kirim /start terlebih dahulu untuk mendaftar.');
            return;
        }

        const limitStatus = await checkTransactionLimit(user);

        let message;
        if (user.plan === 'pro' && user.planExpiredAt) {
            message = `
ℹ️ *Status Akun*

Paket: ⭐️ *PRO*
Limit: ${limitStatus.limit} catatan/bulan
Terpakai bulan ini: ${limitStatus.current}/${limitStatus.limit}
Berlaku sampai: ${formatDate(user.planExpiredAt, user.timezone)}

🔄 Perpanjang: /upgrade
`;
        } else {
            message = `
ℹ️ *Status Akun*

Paket: 🆓 *FREE*
Limit: ${limitStatus.limit} catatan/bulan
Terpakai bulan ini: ${limitStatus.current}/${limitStatus.limit}

⭐️ Upgrade ke PRO: /upgrade
`;
        }

        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error in /status command:', error);
        await ctx.reply('Gagal mengambil data. Coba lagi.');
    }
}

module.exports = statusCommand;

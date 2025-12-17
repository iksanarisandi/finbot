/**
 * /history command handler - Show recent transactions
 */

const { getUserByTelegramId } = require('../../services/userService');
const { getRecentTransactions } = require('../../services/transactionService');
const { formatDateShort, formatNumber } = require('../../utils/formatter');

async function historyCommand(ctx) {
    try {
        const user = await getUserByTelegramId(ctx.from.id);

        if (!user) {
            await ctx.reply('Kirim /start terlebih dahulu untuk mendaftar.');
            return;
        }

        // Parse limit from args
        const args = ctx.message.text.split(' ').slice(1);
        let limit = 10;

        if (args.length > 0) {
            const parsed = parseInt(args[0], 10);
            if (!isNaN(parsed) && parsed > 0) {
                limit = Math.min(parsed, 50);
            }
        }

        const transactions = await getRecentTransactions(user.id, limit);

        if (transactions.length === 0) {
            await ctx.reply('Belum ada transaksi. Mulai catat dengan mengirim nominal + deskripsi.\nContoh: `20k makan siang`', { parse_mode: 'Markdown' });
            return;
        }

        let message = `📜 *Transaksi Terakhir* (${transactions.length} terbaru)\n\n`;

        for (const tx of transactions) {
            const emoji = tx.type === 'expense' ? '💸' : '💰';
            const sign = tx.type === 'income' ? '+' : '';
            const date = formatDateShort(tx.date, user.timezone);

            message += `#${tx.seq} | ${date}\n`;
            message += `${emoji} ${sign}Rp ${formatNumber(Number(tx.amount))} - ${tx.description}\n\n`;
        }

        message += `\n📝 Edit: /edit <id> <data baru> _(coming soon)_`;
        message += `\n🗑 Hapus: /delete <id>`;

        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error in /history command:', error);
        await ctx.reply('Gagal mengambil data. Coba lagi.');
    }
}

module.exports = historyCommand;

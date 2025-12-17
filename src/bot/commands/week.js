/**
 * /week command handler - Show last 7 days summary
 */

const { getUserByTelegramId } = require('../../services/userService');
const { getTransactionSummary } = require('../../services/transactionService');
const { getWeekRange, formatCurrency } = require('../../utils/formatter');

async function weekCommand(ctx) {
    try {
        const user = await getUserByTelegramId(ctx.from.id);

        if (!user) {
            await ctx.reply('Kirim /start terlebih dahulu untuk mendaftar.');
            return;
        }

        const { start, end, startDisplay, endDisplay } = getWeekRange(user.timezone);
        const summary = await getTransactionSummary(user.id, start, end);

        const balanceSign = summary.balance >= 0 ? '+' : '';

        const message = `
📊 *Rekap 7 Hari Terakhir*
📅 ${startDisplay} - ${endDisplay}

💸 Pengeluaran: ${formatCurrency(summary.totalExpense)}
💰 Pemasukan: ${formatCurrency(summary.totalIncome)}
📈 Selisih: ${balanceSign}${formatCurrency(summary.balance)}

📝 Total: ${summary.count} catatan

📜 Lihat detail: /history
`;

        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error in /week command:', error);
        await ctx.reply('Gagal mengambil data. Coba lagi.');
    }
}

module.exports = weekCommand;

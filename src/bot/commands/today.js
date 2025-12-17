/**
 * /today command handler - Show today's summary
 */

const { getUserByTelegramId } = require('../../services/userService');
const { getTransactionSummary } = require('../../services/transactionService');
const { getTodayRange, formatCurrency, formatFullDate } = require('../../utils/formatter');

async function todayCommand(ctx) {
    try {
        const user = await getUserByTelegramId(ctx.from.id);

        if (!user) {
            await ctx.reply('Kirim /start terlebih dahulu untuk mendaftar.');
            return;
        }

        const { start, end } = getTodayRange(user.timezone);
        const summary = await getTransactionSummary(user.id, start, end);

        const balanceSign = summary.balance >= 0 ? '+' : '';
        const today = formatFullDate(new Date(), user.timezone);

        const message = `
📊 *Rekap Hari Ini*
🗓 ${today}

💸 Pengeluaran: ${formatCurrency(summary.totalExpense)}
💰 Pemasukan: ${formatCurrency(summary.totalIncome)}
📈 Selisih: ${balanceSign}${formatCurrency(summary.balance)}

📝 Total: ${summary.count} catatan

📜 Lihat detail: /history
`;

        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error in /today command:', error);
        await ctx.reply('Gagal mengambil data. Coba lagi.');
    }
}

module.exports = todayCommand;

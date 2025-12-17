/**
 * /month command handler - Show monthly summary
 */

const { getUserByTelegramId, checkTransactionLimit } = require('../../services/userService');
const { getTransactionSummary } = require('../../services/transactionService');
const { getMonthRange, getSpecificMonthRange, formatCurrency } = require('../../utils/formatter');

async function monthCommand(ctx) {
    try {
        const user = await getUserByTelegramId(ctx.from.id);

        if (!user) {
            await ctx.reply('Kirim /start terlebih dahulu untuk mendaftar.');
            return;
        }

        // Check if specific month is requested
        const args = ctx.message.text.split(' ').slice(1);
        let dateRange;

        if (args.length > 0) {
            const yearMonth = args[0];
            dateRange = getSpecificMonthRange(yearMonth, user.timezone);

            if (!dateRange) {
                await ctx.reply('Format salah. Contoh: /month 2024-11');
                return;
            }

            // Check if month is in the future
            if (dateRange.start > new Date()) {
                await ctx.reply('Tidak bisa melihat bulan yang belum terjadi.');
                return;
            }

            // Check if month is before user registration
            if (dateRange.end < new Date(user.createdAt)) {
                await ctx.reply('Anda belum terdaftar di bulan itu.');
                return;
            }
        } else {
            dateRange = getMonthRange(user.timezone);
        }

        const summary = await getTransactionSummary(user.id, dateRange.start, dateRange.end);
        const limitStatus = await checkTransactionLimit(user);
        const balanceSign = summary.balance >= 0 ? '+' : '';

        const planLabel = user.plan === 'pro' ? 'Pro' : 'Free';

        const message = `
📊 *Rekap Bulan Ini*
📅 ${dateRange.display}

💸 Pengeluaran: ${formatCurrency(summary.totalExpense)}
💰 Pemasukan: ${formatCurrency(summary.totalIncome)}
📈 Selisih: ${balanceSign}${formatCurrency(summary.balance)}

📝 Total: ${summary.count} catatan
📊 Limit: ${limitStatus.current}/${limitStatus.limit} (${planLabel})

📜 Lihat detail: /history
`;

        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error in /month command:', error);
        await ctx.reply('Gagal mengambil data. Coba lagi.');
    }
}

module.exports = monthCommand;

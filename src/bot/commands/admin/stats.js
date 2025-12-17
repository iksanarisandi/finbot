/**
 * /stats command handler - Admin system statistics
 */

const { requireAdmin } = require('../../../middleware/auth');
const { getSystemStats } = require('../../../services/userService');
const { formatDate, formatNumber } = require('../../../utils/formatter');

// Track bot start time
const botStartTime = new Date();

/**
 * Get uptime string
 */
function getUptime() {
    const now = new Date();
    const diff = now - botStartTime;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
        return `${days} hari ${hours} jam`;
    } else if (hours > 0) {
        return `${hours} jam ${minutes} menit`;
    } else {
        return `${minutes} menit`;
    }
}

/**
 * Stats command
 * Usage: /stats
 */
async function statsCommand(ctx) {
    try {
        const stats = await getSystemStats();
        const now = formatDate(new Date(), 'Asia/Jakarta');
        const uptime = getUptime();

        const message = `
📊 *Statistik Sistem*
🕐 ${now}

👥 Total Users: ${formatNumber(stats.totalUsers)}
⭐️ User Pro Aktif: ${formatNumber(stats.proUsers)}
💸 Total Transaksi: ${formatNumber(stats.totalTransactions)}
📅 Transaksi Bulan Ini: ${formatNumber(stats.monthlyTransactions)}
⏳ Pending Payments: ${formatNumber(stats.pendingPayments)}

🟢 Database: ✅ Healthy
⏱ Bot Uptime: ${uptime}
`;

        await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error in /stats command:', error);
        await ctx.reply('Gagal mengambil statistik.');
    }
}

module.exports = {
    statsCommand,
    middleware: requireAdmin
};

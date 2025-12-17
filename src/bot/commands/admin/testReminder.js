/**
 * /testreminder - Admin command to manually trigger reminder (for testing)
 */

const { sendDailyReminders } = require('../../../services/reminderService');

async function testReminderCommand(ctx, bot) {
    try {
        await ctx.reply('🔔 Menjalankan reminder test...');

        // Run the reminder function
        await sendDailyReminders(bot);

        await ctx.reply('✅ Reminder test selesai! Cek log untuk detail.');
    } catch (error) {
        console.error('Error in test reminder:', error);
        await ctx.reply('❌ Gagal menjalankan test reminder.');
    }
}

module.exports = { testReminderCommand };

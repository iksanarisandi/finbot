/**
 * /reminder command - toggle daily reminder notifications
 */

const { toggleReminder, getReminderStatus } = require('../../services/reminderService');

async function reminderCommand(ctx) {
    try {
        const args = ctx.message.text.split(' ').slice(1);
        const action = args[0]?.toLowerCase();
        const telegramId = ctx.from.id;

        if (action === 'on') {
            await toggleReminder(telegramId, true);
            await ctx.reply('✅ Pengingat harian *AKTIF*\n\nAnda akan diingatkan jam 21:00 WIB jika belum mencatat.', {
                parse_mode: 'Markdown'
            });
        } else if (action === 'off') {
            await toggleReminder(telegramId, false);
            await ctx.reply('🔕 Pengingat harian *NONAKTIF*\n\nKetik /reminder on untuk mengaktifkan kembali.', {
                parse_mode: 'Markdown'
            });
        } else {
            // Show current status
            const enabled = await getReminderStatus(telegramId);
            const status = enabled ? '✅ Aktif' : '🔕 Nonaktif';

            await ctx.reply(`
🔔 *Pengingat Harian*

Status: ${status}
Waktu: 21:00 WIB

*Perintah:*
/reminder on - Aktifkan
/reminder off - Nonaktifkan

_Pengingat hanya dikirim jika Anda belum mencatat hari itu._
`, { parse_mode: 'Markdown' });
        }
    } catch (error) {
        console.error('Error in reminder command:', error);
        await ctx.reply('Gagal mengubah pengaturan. Coba lagi.');
    }
}

module.exports = reminderCommand;

/**
 * Reminder service - handles daily reminder notifications
 */

const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Reminder message
const REMINDER_MESSAGE = `
💡 *Pengingat Harian*

Sudah catat pengeluaran hari ini?

Ketik langsung: \`20k makan siang\`

_Matikan pengingat: /reminder off_
`;

/**
 * Get users who need reminder (enabled + no transaction today)
 */
async function getUsersNeedingReminder() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get users with reminder enabled who have no transactions today
    const users = await prisma.user.findMany({
        where: {
            reminderEnabled: true,
            transactions: {
                none: {
                    date: {
                        gte: today,
                        lt: tomorrow
                    }
                }
            }
        },
        select: {
            telegramId: true,
            firstName: true
        }
    });

    return users;
}

/**
 * Send reminder to a single user
 */
async function sendReminder(bot, telegramId) {
    try {
        await bot.telegram.sendMessage(telegramId.toString(), REMINDER_MESSAGE, {
            parse_mode: 'Markdown'
        });
        return true;
    } catch (error) {
        // User might have blocked the bot
        if (error.response?.error_code === 403) {
            console.log(`[REMINDER] User ${telegramId} blocked bot, disabling reminder`);
            await prisma.user.update({
                where: { telegramId },
                data: { reminderEnabled: false }
            });
        } else {
            console.error(`[REMINDER] Failed to send to ${telegramId}:`, error.message);
        }
        return false;
    }
}

/**
 * Send reminders to all eligible users
 */
async function sendDailyReminders(bot) {
    console.log('[REMINDER] Starting daily reminder job...');

    try {
        const users = await getUsersNeedingReminder();
        console.log(`[REMINDER] Found ${users.length} users needing reminder`);

        let sent = 0;
        let failed = 0;

        for (const user of users) {
            const success = await sendReminder(bot, user.telegramId);
            if (success) sent++;
            else failed++;

            // Rate limiting: wait 50ms between messages (max 20/sec)
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        console.log(`[REMINDER] Completed: ${sent} sent, ${failed} failed`);
    } catch (error) {
        console.error('[REMINDER] Job failed:', error);
    }
}

/**
 * Toggle reminder for a user
 */
async function toggleReminder(telegramId, enabled) {
    return prisma.user.update({
        where: { telegramId: BigInt(telegramId) },
        data: { reminderEnabled: enabled }
    });
}

/**
 * Get reminder status for a user
 */
async function getReminderStatus(telegramId) {
    const user = await prisma.user.findUnique({
        where: { telegramId: BigInt(telegramId) },
        select: { reminderEnabled: true }
    });
    return user?.reminderEnabled ?? true;
}

/**
 * Schedule daily reminder at 9 PM WIB (14:00 UTC)
 */
function scheduleReminder(bot) {
    // 9 PM WIB = 14:00 UTC (WIB is UTC+7)
    cron.schedule('0 14 * * *', () => {
        sendDailyReminders(bot);
    }, {
        timezone: 'Asia/Jakarta'
    });

    console.log('📅 Daily reminder scheduled for 21:00 WIB');
}

module.exports = {
    scheduleReminder,
    sendDailyReminders,
    toggleReminder,
    getReminderStatus
};

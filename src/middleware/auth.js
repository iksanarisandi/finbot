/**
 * Admin authentication middleware
 */

const ADMIN_IDS = (process.env.ADMIN_IDS || '')
    .split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id));

/**
 * Check if user is admin
 * @param {number} telegramId
 * @returns {boolean}
 */
function isAdmin(telegramId) {
    return ADMIN_IDS.includes(telegramId);
}

/**
 * Admin-only middleware
 * @param {Object} ctx - Telegraf context
 * @param {Function} next - Next middleware
 */
async function requireAdmin(ctx, next) {
    const userId = ctx.from?.id;

    if (!userId || !isAdmin(userId)) {
        console.log(`[SECURITY] Unauthorized admin attempt from user ${userId}`);
        await ctx.reply('⛔️ Unauthorized');
        return;
    }

    return next();
}

module.exports = {
    isAdmin,
    requireAdmin,
    ADMIN_IDS
};

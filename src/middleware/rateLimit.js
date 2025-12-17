/**
 * Simple in-memory rate limiter
 */

const rateLimiter = new Map();

// Cleanup old entries every hour
setInterval(() => {
    const now = Date.now();
    for (const [key, requests] of rateLimiter.entries()) {
        const filtered = requests.filter(time => now - time < 3600000); // 1 hour max
        if (filtered.length === 0) {
            rateLimiter.delete(key);
        } else {
            rateLimiter.set(key, filtered);
        }
    }
}, 3600000);

/**
 * Check if rate limit is exceeded
 * @param {string|number} userId - User identifier
 * @param {string} action - Action type
 * @param {number} limit - Max requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - true if allowed, false if rate limited
 */
function checkRateLimit(userId, action, limit, windowMs) {
    const key = `${userId}:${action}`;
    const now = Date.now();

    if (!rateLimiter.has(key)) {
        rateLimiter.set(key, []);
    }

    const requests = rateLimiter.get(key);

    // Remove old requests outside window
    const validRequests = requests.filter(time => now - time < windowMs);

    if (validRequests.length >= limit) {
        return false; // Rate limit exceeded
    }

    validRequests.push(now);
    rateLimiter.set(key, validRequests);
    return true;
}

// Rate limit configurations
const limits = {
    transaction: { limit: 20, windowMs: 3600000 }, // 20 per hour
    month: { limit: 5, windowMs: 60000 }, // 5 per minute
    history: { limit: 10, windowMs: 60000 }, // 10 per minute
    upgrade: { limit: 3, windowMs: 3600000 }, // 3 per hour
    photo: { limit: 5, windowMs: 3600000 } // 5 per hour
};

/**
 * Rate limit middleware factory
 * @param {string} action - Action type
 * @returns {Function} - Telegraf middleware
 */
function rateLimitMiddleware(action) {
    const config = limits[action] || { limit: 30, windowMs: 60000 };

    return async (ctx, next) => {
        const userId = ctx.from?.id;
        if (!userId) return next();

        if (!checkRateLimit(userId, action, config.limit, config.windowMs)) {
            await ctx.reply('⏳ Terlalu banyak request. Tunggu sebentar.');
            return;
        }

        return next();
    };
}

module.exports = {
    checkRateLimit,
    rateLimitMiddleware,
    limits
};

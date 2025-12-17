/**
 * Enhanced security middleware
 * - Rate limiting with multiple tiers
 * - Spam detection
 * - Flood protection
 * - Audit logging for security events
 */

const { logAudit } = require('../services/userService');

// ============================================
// RATE LIMITER
// ============================================

const rateLimiter = new Map();
const globalRateLimiter = new Map();
const spamTracker = new Map();
const blockedUsers = new Map();

// Cleanup old entries every 30 minutes
setInterval(() => {
    const now = Date.now();

    // Cleanup rate limiter
    for (const [key, requests] of rateLimiter.entries()) {
        const filtered = requests.filter(time => now - time < 3600000);
        if (filtered.length === 0) {
            rateLimiter.delete(key);
        } else {
            rateLimiter.set(key, filtered);
        }
    }

    // Cleanup global rate limiter
    for (const [key, data] of globalRateLimiter.entries()) {
        if (now - data.lastRequest > 60000) {
            globalRateLimiter.delete(key);
        }
    }

    // Cleanup spam tracker
    for (const [key, data] of spamTracker.entries()) {
        if (now - data.lastMessage > 300000) { // 5 minutes
            spamTracker.delete(key);
        }
    }

    // Cleanup expired blocks
    for (const [userId, expiry] of blockedUsers.entries()) {
        if (now > expiry) {
            blockedUsers.delete(userId);
            console.log(`[SECURITY] User ${userId} unblocked (timeout expired)`);
        }
    }
}, 1800000);

// Rate limit configurations
const limits = {
    transaction: { limit: 20, windowMs: 3600000 }, // 20 per hour
    month: { limit: 5, windowMs: 60000 }, // 5 per minute
    history: { limit: 10, windowMs: 60000 }, // 10 per minute
    upgrade: { limit: 3, windowMs: 3600000 }, // 3 per hour
    photo: { limit: 5, windowMs: 3600000 }, // 5 per hour
    start: { limit: 5, windowMs: 60000 }, // 5 per minute (anti-spam)
    delete: { limit: 10, windowMs: 60000 }, // 10 per minute
    global: { limit: 60, windowMs: 60000 } // 60 requests per minute (global)
};

/**
 * Check if rate limit is exceeded
 */
function checkRateLimit(userId, action, limit, windowMs) {
    const key = `${userId}:${action}`;
    const now = Date.now();

    if (!rateLimiter.has(key)) {
        rateLimiter.set(key, []);
    }

    const requests = rateLimiter.get(key);
    const validRequests = requests.filter(time => now - time < windowMs);

    if (validRequests.length >= limit) {
        return false;
    }

    validRequests.push(now);
    rateLimiter.set(key, validRequests);
    return true;
}

/**
 * Check global rate limit (all actions combined)
 */
function checkGlobalRateLimit(userId) {
    const now = Date.now();
    const config = limits.global;

    if (!globalRateLimiter.has(userId)) {
        globalRateLimiter.set(userId, { count: 0, windowStart: now, lastRequest: now });
    }

    const data = globalRateLimiter.get(userId);

    // Reset window if expired
    if (now - data.windowStart > config.windowMs) {
        data.count = 0;
        data.windowStart = now;
    }

    data.count++;
    data.lastRequest = now;

    if (data.count > config.limit) {
        return false;
    }

    return true;
}

// ============================================
// SPAM DETECTION
// ============================================

const SPAM_CONFIG = {
    maxSimilarMessages: 5, // Max identical messages in window
    windowMs: 60000, // 1 minute
    blockDurationMs: 300000 // 5 minute block
};

/**
 * Check for spam patterns
 */
function checkSpam(userId, messageText) {
    const now = Date.now();
    const messageHash = simpleHash(messageText?.toLowerCase() || '');

    if (!spamTracker.has(userId)) {
        spamTracker.set(userId, {
            messages: [],
            lastMessage: now
        });
    }

    const tracker = spamTracker.get(userId);

    // Remove old messages
    tracker.messages = tracker.messages.filter(
        msg => now - msg.time < SPAM_CONFIG.windowMs
    );

    // Check for repeated messages
    const sameMessages = tracker.messages.filter(msg => msg.hash === messageHash);

    if (sameMessages.length >= SPAM_CONFIG.maxSimilarMessages) {
        return { isSpam: true, reason: 'repeated_message' };
    }

    // Check for too many messages
    if (tracker.messages.length >= 30) { // 30 messages per minute is suspicious
        return { isSpam: true, reason: 'flood' };
    }

    // Add current message
    tracker.messages.push({ hash: messageHash, time: now });
    tracker.lastMessage = now;

    return { isSpam: false };
}

/**
 * Simple hash function for message comparison
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

/**
 * Block a user temporarily
 */
function blockUser(userId, durationMs = SPAM_CONFIG.blockDurationMs) {
    blockedUsers.set(userId, Date.now() + durationMs);
    console.log(`[SECURITY] User ${userId} blocked for ${durationMs / 1000}s`);
}

/**
 * Check if user is blocked
 */
function isBlocked(userId) {
    if (!blockedUsers.has(userId)) return false;

    const expiry = blockedUsers.get(userId);
    if (Date.now() > expiry) {
        blockedUsers.delete(userId);
        return false;
    }

    return true;
}

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Global security middleware - should be applied first
 */
async function securityMiddleware(ctx, next) {
    const userId = ctx.from?.id;
    if (!userId) return next();

    // Check if user is blocked
    if (isBlocked(userId)) {
        console.log(`[SECURITY] Blocked user ${userId} attempted access`);
        return; // Silently ignore blocked users
    }

    // Check global rate limit
    if (!checkGlobalRateLimit(userId)) {
        console.log(`[SECURITY] Global rate limit exceeded for user ${userId}`);
        await ctx.reply('⏳ Terlalu banyak request. Tunggu 1 menit.');
        return;
    }

    // Check for spam (only for text messages)
    if (ctx.message?.text) {
        const spamCheck = checkSpam(userId, ctx.message.text);
        if (spamCheck.isSpam) {
            console.log(`[SECURITY] Spam detected from user ${userId}: ${spamCheck.reason}`);
            blockUser(userId);
            await ctx.reply('⚠️ Aktivitas mencurigakan terdeteksi. Anda diblokir sementara.');

            // Log to audit
            try {
                await logAudit(null, null, 'spam_detected', {
                    telegramId: userId,
                    reason: spamCheck.reason,
                    username: ctx.from?.username
                });
            } catch (e) {
                console.error('Failed to log spam event:', e);
            }

            return;
        }
    }

    return next();
}

/**
 * Rate limit middleware factory
 */
function rateLimitMiddleware(action) {
    const config = limits[action] || { limit: 30, windowMs: 60000 };

    return async (ctx, next) => {
        const userId = ctx.from?.id;
        if (!userId) return next();

        if (!checkRateLimit(userId, action, config.limit, config.windowMs)) {
            const waitTime = Math.ceil(config.windowMs / 60000);
            await ctx.reply(`⏳ Terlalu banyak request. Tunggu ${waitTime} menit.`);
            return;
        }

        return next();
    };
}

// ============================================
// ADMIN AUTH
// ============================================

const ADMIN_IDS = (process.env.ADMIN_IDS || '')
    .split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id));

function isAdmin(telegramId) {
    return ADMIN_IDS.includes(telegramId);
}

async function requireAdmin(ctx, next) {
    const userId = ctx.from?.id;

    if (!userId || !isAdmin(userId)) {
        console.log(`[SECURITY] Unauthorized admin attempt from user ${userId}`);

        // Log to audit
        try {
            await logAudit(null, userId, 'unauthorized_admin_attempt', {
                command: ctx.message?.text,
                username: ctx.from?.username
            });
        } catch (e) {
            console.error('Failed to log unauthorized attempt:', e);
        }

        await ctx.reply('⛔️ Unauthorized');
        return;
    }

    return next();
}

// ============================================
// INPUT SANITIZATION
// ============================================

/**
 * Sanitize user input to prevent injection attacks
 */
function sanitizeInput(text) {
    if (!text || typeof text !== 'string') return '';

    return text
        .trim()
        .slice(0, 500) // Max length
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .replace(/<[^>]*>/g, ''); // Remove HTML tags
}

module.exports = {
    // Rate limiting
    checkRateLimit,
    checkGlobalRateLimit,
    rateLimitMiddleware,
    limits,

    // Spam protection
    checkSpam,
    blockUser,
    isBlocked,

    // Admin auth
    isAdmin,
    requireAdmin,
    ADMIN_IDS,

    // Security middleware
    securityMiddleware,

    // Input sanitization
    sanitizeInput
};

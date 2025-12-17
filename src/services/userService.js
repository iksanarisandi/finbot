/**
 * User service - handles user data operations
 */

const { PrismaClient } = require('@prisma/client');
const { getCurrentMonthKey } = require('../utils/formatter');

const prisma = new PrismaClient();

/**
 * Find or create user
 * @param {Object} telegramUser - Telegram user object
 * @returns {Promise<Object>} - User record
 */
async function findOrCreateUser(telegramUser) {
    const { id: telegramId, username, first_name: firstName } = telegramUser;

    let user = await prisma.user.findUnique({
        where: { telegramId: BigInt(telegramId) }
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                telegramId: BigInt(telegramId),
                username,
                firstName,
                plan: 'free',
                monthlyLimit: 15,
                timezone: 'Asia/Jakarta',
                seq: 0
            }
        });

        // Log registration
        await logAudit(user.id, null, 'user_registered', {
            telegramId,
            username
        });
    }

    return user;
}

/**
 * Get user by telegram ID
 * @param {number} telegramId
 * @returns {Promise<Object|null>}
 */
async function getUserByTelegramId(telegramId) {
    return prisma.user.findUnique({
        where: { telegramId: BigInt(telegramId) }
    });
}

/**
 * Get user by ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
async function getUserById(id) {
    return prisma.user.findUnique({
        where: { id }
    });
}

/**
 * Get user's monthly transaction count
 * @param {number} userId
 * @param {string} timezone
 * @returns {Promise<number>}
 */
async function getMonthlyTransactionCount(userId, timezone = 'Asia/Jakarta') {
    const { getMonthRange } = require('../utils/formatter');
    const { start, end } = getMonthRange(timezone);

    const count = await prisma.transaction.count({
        where: {
            userId,
            date: {
                gte: start,
                lte: end
            }
        }
    });

    return count;
}

/**
 * Check if user can create more transactions
 * @param {Object} user
 * @returns {Promise<{allowed: boolean, current: number, limit: number}>}
 */
async function checkTransactionLimit(user) {
    const current = await getMonthlyTransactionCount(user.id, user.timezone);

    // Check if Pro plan has expired
    let limit = user.monthlyLimit;
    if (user.plan === 'pro' && user.planExpiredAt) {
        if (new Date(user.planExpiredAt) < new Date()) {
            // Pro expired, revert to free
            await prisma.user.update({
                where: { id: user.id },
                data: { plan: 'free', monthlyLimit: 15 }
            });
            limit = 15;
        }
    }

    return {
        allowed: current < limit,
        current,
        limit
    };
}

/**
 * Increment user's seq and return new value
 * @param {number} userId
 * @returns {Promise<number>}
 */
async function incrementUserSeq(userId) {
    const user = await prisma.user.update({
        where: { id: userId },
        data: { seq: { increment: 1 } }
    });
    return user.seq;
}

/**
 * Upgrade user to Pro
 * @param {number} userId
 * @param {number} durationMonths
 * @param {number} adminId
 * @returns {Promise<Object>}
 */
async function upgradeUserToPro(userId, durationMonths, adminId) {
    const expiredAt = new Date();
    expiredAt.setMonth(expiredAt.getMonth() + durationMonths);

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            plan: 'pro',
            monthlyLimit: 200,
            planExpiredAt: expiredAt
        }
    });

    await logAudit(userId, adminId, 'user_upgraded', {
        plan: 'pro',
        durationMonths,
        expiredAt
    });

    return user;
}

/**
 * Downgrade user to Free
 * @param {number} userId
 * @param {number} adminId
 * @returns {Promise<Object>}
 */
async function downgradeUserToFree(userId, adminId) {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            plan: 'free',
            monthlyLimit: 15,
            planExpiredAt: null
        }
    });

    await logAudit(userId, adminId, 'user_downgraded', {
        plan: 'free'
    });

    return user;
}

/**
 * Log audit event
 * @param {number|null} userId
 * @param {number|null} adminId
 * @param {string} action
 * @param {Object} details
 */
async function logAudit(userId, adminId, action, details) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                adminId: adminId ? BigInt(adminId) : null,
                action,
                details
            }
        });
    } catch (error) {
        console.error('Failed to log audit:', error);
    }
}

/**
 * Get system statistics
 * @returns {Promise<Object>}
 */
async function getSystemStats() {
    const [
        totalUsers,
        proUsers,
        totalTransactions,
        monthlyTransactions,
        pendingPayments
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
            where: {
                plan: 'pro',
                planExpiredAt: { gt: new Date() }
            }
        }),
        prisma.transaction.count(),
        prisma.transaction.count({
            where: {
                date: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }
        }),
        prisma.paymentRequest.count({
            where: { status: 'pending' }
        })
    ]);

    return {
        totalUsers,
        proUsers,
        totalTransactions,
        monthlyTransactions,
        pendingPayments
    };
}

module.exports = {
    prisma,
    findOrCreateUser,
    getUserByTelegramId,
    getUserById,
    getMonthlyTransactionCount,
    checkTransactionLimit,
    incrementUserSeq,
    upgradeUserToPro,
    downgradeUserToFree,
    logAudit,
    getSystemStats
};

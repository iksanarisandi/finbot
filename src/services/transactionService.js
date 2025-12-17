/**
 * Transaction service - handles transaction operations
 */

const { prisma, incrementUserSeq, logAudit } = require('./userService');

/**
 * Create a new transaction
 * @param {Object} user - User record
 * @param {Object} transactionData - { amount, type, description }
 * @returns {Promise<Object>} - Created transaction
 */
async function createTransaction(user, { amount, type, description }) {
    // Use a transaction to ensure seq increment and insert are atomic
    const result = await prisma.$transaction(async (tx) => {
        // Increment seq
        const updatedUser = await tx.user.update({
            where: { id: user.id },
            data: { seq: { increment: 1 } }
        });

        // Create transaction
        const transaction = await tx.transaction.create({
            data: {
                userId: user.id,
                seq: updatedUser.seq,
                amount: BigInt(amount),
                type,
                description,
                date: new Date()
            }
        });

        return transaction;
    });

    // Log audit
    await logAudit(user.id, null, 'transaction_created', {
        seq: result.seq,
        amount,
        type,
        description
    });

    return result;
}

/**
 * Get transaction by user and seq
 * @param {number} userId
 * @param {number} seq
 * @returns {Promise<Object|null>}
 */
async function getTransactionBySeq(userId, seq) {
    return prisma.transaction.findUnique({
        where: {
            userId_seq: { userId, seq }
        }
    });
}

/**
 * Get user's recent transactions
 * @param {number} userId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function getRecentTransactions(userId, limit = 10) {
    return prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: Math.min(limit, 50)
    });
}

/**
 * Delete a transaction
 * @param {number} userId
 * @param {number} seq
 * @returns {Promise<Object|null>}
 */
async function deleteTransaction(userId, seq) {
    const transaction = await getTransactionBySeq(userId, seq);

    if (!transaction) {
        return null;
    }

    await prisma.transaction.delete({
        where: { id: transaction.id }
    });

    await logAudit(userId, null, 'transaction_deleted', {
        seq,
        amount: Number(transaction.amount),
        type: transaction.type,
        description: transaction.description
    });

    return transaction;
}

/**
 * Get transactions in date range with summaries
 * @param {number} userId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<Object>}
 */
async function getTransactionSummary(userId, startDate, endDate) {
    const transactions = await prisma.transaction.findMany({
        where: {
            userId,
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        orderBy: { date: 'desc' }
    });

    let totalExpense = 0n;
    let totalIncome = 0n;

    for (const tx of transactions) {
        if (tx.type === 'expense') {
            totalExpense += tx.amount;
        } else {
            totalIncome += tx.amount;
        }
    }

    return {
        transactions,
        count: transactions.length,
        totalExpense: Number(totalExpense),
        totalIncome: Number(totalIncome),
        balance: Number(totalIncome - totalExpense)
    };
}

module.exports = {
    createTransaction,
    getTransactionBySeq,
    getRecentTransactions,
    deleteTransaction,
    getTransactionSummary
};

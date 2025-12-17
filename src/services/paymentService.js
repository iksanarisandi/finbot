/**
 * Payment service - handles subscription payments
 */

const { prisma, logAudit } = require('./userService');

const PRO_PRICE = parseInt(process.env.PRO_PRICE || '25000', 10);

/**
 * Generate payment reference code
 * @param {number} userId
 * @returns {string}
 */
function generateReferenceCode(userId) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    return `FIN-${userId}-${dateStr}`;
}

/**
 * Create a payment request
 * @param {number} userId
 * @param {string} plan - 'pro'
 * @param {number} durationMonths
 * @returns {Promise<Object>}
 */
async function createPaymentRequest(userId, plan = 'pro', durationMonths = 1) {
    // Cancel any existing pending payments
    await prisma.paymentRequest.updateMany({
        where: {
            userId,
            status: 'pending'
        },
        data: {
            status: 'expired'
        }
    });

    const referenceCode = generateReferenceCode(userId);
    const expiredAt = new Date();
    expiredAt.setHours(expiredAt.getHours() + 24);

    const paymentRequest = await prisma.paymentRequest.create({
        data: {
            userId,
            referenceCode,
            planRequested: plan,
            amount: PRO_PRICE * durationMonths,
            durationMonths,
            status: 'pending',
            expiredAt
        }
    });

    await logAudit(userId, null, 'payment_request_created', {
        referenceCode,
        plan,
        amount: paymentRequest.amount
    });

    return paymentRequest;
}

/**
 * Get pending payment request for user
 * @param {number} userId
 * @returns {Promise<Object|null>}
 */
async function getPendingPaymentRequest(userId) {
    return prisma.paymentRequest.findFirst({
        where: {
            userId,
            status: 'pending',
            expiredAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
    });
}

/**
 * Update payment request with proof
 * @param {number} paymentId
 * @param {string} fileId
 * @returns {Promise<Object>}
 */
async function submitPaymentProof(paymentId, fileId) {
    return prisma.paymentRequest.update({
        where: { id: paymentId },
        data: { proofFileId: fileId }
    });
}

/**
 * Verify payment request
 * @param {number} userId
 * @param {number} adminId
 * @returns {Promise<Object|null>}
 */
async function verifyPayment(userId, adminId) {
    const payment = await getPendingPaymentRequest(userId);

    if (!payment) {
        return null;
    }

    const updatedPayment = await prisma.paymentRequest.update({
        where: { id: payment.id },
        data: {
            status: 'verified',
            verifiedAt: new Date(),
            verifiedByAdminId: BigInt(adminId)
        }
    });

    await logAudit(userId, adminId, 'payment_verified', {
        referenceCode: payment.referenceCode,
        amount: payment.amount
    });

    return updatedPayment;
}

/**
 * Reject payment request
 * @param {number} userId
 * @param {number} adminId
 * @param {string} reason
 * @returns {Promise<Object|null>}
 */
async function rejectPayment(userId, adminId, reason = 'Bukti tidak valid') {
    const payment = await getPendingPaymentRequest(userId);

    if (!payment) {
        return null;
    }

    const updatedPayment = await prisma.paymentRequest.update({
        where: { id: payment.id },
        data: {
            status: 'rejected',
            rejectionReason: reason,
            verifiedByAdminId: BigInt(adminId)
        }
    });

    await logAudit(userId, adminId, 'payment_rejected', {
        referenceCode: payment.referenceCode,
        reason
    });

    return updatedPayment;
}

/**
 * Get payment request by reference code
 * @param {string} referenceCode
 * @returns {Promise<Object|null>}
 */
async function getPaymentByReference(referenceCode) {
    return prisma.paymentRequest.findUnique({
        where: { referenceCode },
        include: { user: true }
    });
}

module.exports = {
    PRO_PRICE,
    generateReferenceCode,
    createPaymentRequest,
    getPendingPaymentRequest,
    submitPaymentProof,
    verifyPayment,
    rejectPayment,
    getPaymentByReference
};

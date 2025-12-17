const dayjs = require('dayjs');
require('dayjs/locale/id');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const relativeTime = require('dayjs/plugin/relativeTime');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale('id');

const DEFAULT_TIMEZONE = 'Asia/Jakarta';

/**
 * Format currency in Indonesian Rupiah
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Format currency without "Rp" prefix
 * @param {number} amount
 * @returns {string}
 */
function formatNumber(amount) {
    return new Intl.NumberFormat('id-ID').format(amount);
}

/**
 * Format date for display
 * @param {Date} date
 * @param {string} tz - timezone
 * @returns {string}
 */
function formatDate(date, tz = DEFAULT_TIMEZONE) {
    return dayjs(date).tz(tz).format('D MMM YYYY, HH:mm');
}

/**
 * Format date short (for history)
 * @param {Date} date
 * @param {string} tz
 * @returns {string}
 */
function formatDateShort(date, tz = DEFAULT_TIMEZONE) {
    const d = dayjs(date).tz(tz);
    const now = dayjs().tz(tz);

    if (d.isSame(now, 'day')) {
        return `Hari ini, ${d.format('HH:mm')}`;
    } else if (d.isSame(now.subtract(1, 'day'), 'day')) {
        return `Kemarin, ${d.format('HH:mm')}`;
    } else {
        return d.format('D MMM, HH:mm');
    }
}

/**
 * Format full date with day name
 * @param {Date} date
 * @param {string} tz
 * @returns {string}
 */
function formatFullDate(date, tz = DEFAULT_TIMEZONE) {
    return dayjs(date).tz(tz).format('dddd, D MMMM YYYY');
}

/**
 * Get start and end of today
 * @param {string} tz
 * @returns {{ start: Date, end: Date }}
 */
function getTodayRange(tz = DEFAULT_TIMEZONE) {
    const now = dayjs().tz(tz);
    return {
        start: now.startOf('day').toDate(),
        end: now.endOf('day').toDate()
    };
}

/**
 * Get last 7 days range
 * @param {string} tz
 * @returns {{ start: Date, end: Date, startDisplay: string, endDisplay: string }}
 */
function getWeekRange(tz = DEFAULT_TIMEZONE) {
    const now = dayjs().tz(tz);
    const start = now.subtract(6, 'day').startOf('day');
    const end = now.endOf('day');

    return {
        start: start.toDate(),
        end: end.toDate(),
        startDisplay: start.format('D MMM'),
        endDisplay: end.format('D MMM YYYY')
    };
}

/**
 * Get current month range
 * @param {string} tz
 * @returns {{ start: Date, end: Date, display: string }}
 */
function getMonthRange(tz = DEFAULT_TIMEZONE) {
    const now = dayjs().tz(tz);
    return {
        start: now.startOf('month').toDate(),
        end: now.endOf('month').toDate(),
        display: now.format('MMMM YYYY')
    };
}

/**
 * Get specific month range
 * @param {string} yearMonth - Format YYYY-MM
 * @param {string} tz
 * @returns {{ start: Date, end: Date, display: string } | null}
 */
function getSpecificMonthRange(yearMonth, tz = DEFAULT_TIMEZONE) {
    const match = yearMonth.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
        return null;
    }

    const date = dayjs.tz(`${yearMonth}-01`, tz);
    if (!date.isValid()) {
        return null;
    }

    return {
        start: date.startOf('month').toDate(),
        end: date.endOf('month').toDate(),
        display: date.format('MMMM YYYY')
    };
}

/**
 * Get current month key (YYYY-MM)
 * @param {string} tz
 * @returns {string}
 */
function getCurrentMonthKey(tz = DEFAULT_TIMEZONE) {
    return dayjs().tz(tz).format('YYYY-MM');
}

module.exports = {
    formatCurrency,
    formatNumber,
    formatDate,
    formatDateShort,
    formatFullDate,
    getTodayRange,
    getWeekRange,
    getMonthRange,
    getSpecificMonthRange,
    getCurrentMonthKey,
    DEFAULT_TIMEZONE
};

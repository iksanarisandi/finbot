/**
 * Amount and description parser for natural language transaction input
 */

// Regex to match amount with optional +/- prefix and k/K suffix
const AMOUNT_REGEX = /^([+-])?\s*([\d.,]+)\s*([kK])?\s*/;

// Keywords that indicate income
const INCOME_KEYWORDS = /\b(terima|dapat|gaji|income|masuk|bonus|transfer\s*masuk|pendapatan)\b/i;

/**
 * Parse transaction input from natural language
 * @param {string} text - User input text
 * @returns {{ amount: number, type: 'income' | 'expense', description: string } | null}
 */
function parseTransaction(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const trimmed = text.trim();
  const match = trimmed.match(AMOUNT_REGEX);

  if (!match) {
    return null;
  }

  const [fullMatch, sign, rawAmount, multiplier] = match;
  
  // Clean and parse amount
  const cleanedAmount = rawAmount.replace(/[.,]/g, '');
  let amount = parseInt(cleanedAmount, 10);

  if (isNaN(amount) || amount <= 0) {
    return null;
  }

  // Apply multiplier (k = 1000)
  if (multiplier && multiplier.toLowerCase() === 'k') {
    amount *= 1000;
  }

  // Extract description
  const description = trimmed.slice(fullMatch.length).trim();

  if (!description) {
    return null;
  }

  // Determine type
  let type = 'expense';
  
  if (sign === '+') {
    type = 'income';
  } else if (sign === '-') {
    type = 'expense';
  } else if (INCOME_KEYWORDS.test(description)) {
    type = 'income';
  }

  return {
    amount,
    type,
    description: description.slice(0, 200) // Max 200 chars
  };
}

/**
 * Validate parsed transaction
 * @param {{ amount: number, type: string, description: string }} parsed
 * @returns {{ valid: boolean, error?: string }}
 */
function validateTransaction(parsed) {
  if (!parsed) {
    return { valid: false, error: 'PARSE_ERROR' };
  }

  if (parsed.amount === 0) {
    return { valid: false, error: 'AMOUNT_ZERO' };
  }

  if (parsed.amount > 1000000000) {
    return { valid: false, error: 'AMOUNT_TOO_LARGE' };
  }

  if (!parsed.description || parsed.description.trim().length === 0) {
    return { valid: false, error: 'DESCRIPTION_EMPTY' };
  }

  if (parsed.description.length > 200) {
    return { valid: false, error: 'DESCRIPTION_TOO_LONG' };
  }

  return { valid: true };
}

module.exports = {
  parseTransaction,
  validateTransaction
};

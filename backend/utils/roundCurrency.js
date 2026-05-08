// server/utils/roundCurrency.js
/**
 * Converts a decimal amount to an integer representing cents
 * @param {number|string} amount - The currency amount
 * @returns {number} Amount in cents
 */
const toCents = (amount) => Math.round(Number(amount) * 100);
/**
 * Converts an integer representing cents back to a decimal amount
 * @param {number} cents - The amount in cents
 * @returns {number} Decimal currency amount
 */
const fromCents = (cents) => Number((cents / 100).toFixed(2));

module.exports = {
  toCents,
  fromCents,
};

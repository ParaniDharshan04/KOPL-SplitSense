// server/utils/roundCurrency.js
const toCents = (amount) => Math.round(Number(amount) * 100);
const fromCents = (cents) => Number((cents / 100).toFixed(2));

module.exports = {
  toCents,
  fromCents,
};

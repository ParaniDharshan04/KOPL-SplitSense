// server/utils/splitCalculator.js
const { toCents, fromCents } = require("./roundCurrency");

/**
 * GPay-style equal split: divides the total among ALL participants
 * (including the owner/payer). The owner's share is auto-marked as settled.
 *
 * @param {number} totalAmount - Total expense amount
 * @param {string[]} userIds - IDs of users who owe (excluding the owner)
 * @param {string|null} ownerId - ID of the payer/owner to include in the split
 */
const calculateEqualSplit = (totalAmount, userIds, ownerId = null) => {
  const totalCents = toCents(totalAmount);
  // Include the owner in the participant count for division
  const count = ownerId ? userIds.length + 1 : userIds.length;

  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;

  const splits = [];

  if (ownerId) {
    // Owner absorbs ALL remainder so other participants get exactly equal amounts
    const ownerCents = base + remainder;
    splits.push({
      owedBy: ownerId,
      amountOwed: fromCents(ownerCents),
      isSettled: true,
      settledAt: new Date(),
    });

    // All other participants get the exact same base amount
    userIds.forEach((userId) => {
      splits.push({
        owedBy: userId,
        amountOwed: fromCents(base),
        isSettled: false,
      });
    });
  } else {
    // No owner — distribute remainder across participants as before
    userIds.forEach((userId, index) => {
      const cents = base + (index < remainder ? 1 : 0);
      splits.push({
        owedBy: userId,
        amountOwed: fromCents(cents),
        isSettled: false,
      });
    });
  }

  return splits;
};

/**
 * Custom split: each participant has a specific amount.
 * Owner can be included with their own amount, auto-settled.
 *
 * @param {number} totalAmount
 * @param {Object} customAmounts - { userId: amount, ... }
 * @param {string|null} ownerId - If present, owner's entry is auto-settled
 */
const calculateCustomSplit = (totalAmount, customAmounts, ownerId = null) => {
  const totalCents = toCents(totalAmount);

  let sum = 0;
  const split = Object.entries(customAmounts).map(([userId, amount]) => {
    const cents = toCents(amount);
    sum += cents;
    const isOwner = ownerId && String(userId) === String(ownerId);
    return {
      owedBy: userId,
      amountOwed: fromCents(cents),
      isSettled: isOwner ? true : false,
      ...(isOwner ? { settledAt: new Date() } : {}),
    };
  });

  if (sum !== totalCents) {
    const error = new Error("Split amounts do not add up to total");
    error.statusCode = 400;
    throw error;
  }

  return split;
};

module.exports = {
  calculateEqualSplit,
  calculateCustomSplit,
};

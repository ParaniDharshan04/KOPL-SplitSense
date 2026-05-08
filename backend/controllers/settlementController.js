// server/controllers/settlementController.js
const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");
const Notification = require("../models/Notification");
const { successResponse, errorResponse } = require("../utils/apiResponse");

/**
 * Settles a split for a shared expense. Can be called by the person who owes, 
 * or the owner (to mark as paid). Generates an Expense for the payer.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const settleSplit = async (req, res, next) => {
  try {
    const { expenseId, splitId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(expenseId) || !mongoose.Types.ObjectId.isValid(splitId)) {
      return errorResponse(res, 404, "NotFound", "Expense split not found");
    }

    const expense = await Expense.findById(expenseId);
    if (!expense || expense.isDeleted || !expense.isShared) {
      return errorResponse(res, 404, "NotFound", "Expense split not found");
    }

    const split = expense.splitDetails.id(splitId);
    if (!split) {
      return errorResponse(res, 404, "NotFound", "Expense split not found");
    }

    if (split.isCancelled) {
      return errorResponse(res, 400, "BadRequest", "This split is cancelled and cannot be settled");
    }

    if (split.isSettled) {
      return errorResponse(res, 400, "BadRequest", "This split has already been settled");
    }

    const currentUserId = String(req.user._id);
    const ownerId = String(expense.owner);
    const owedById = String(split.owedBy);

    if (currentUserId !== ownerId && currentUserId !== owedById) {
      return errorResponse(res, 403, "Forbidden", "You can only settle your own dues");
    }

    split.isSettled = true;
    split.settledAt = new Date();

    await expense.save();

    const settlement = await Settlement.create({
      expenseId: expense._id,
      settledBy: req.user._id,
      settledTo: expense.owner,
      amount: split.amountOwed,
      settledAt: split.settledAt,
    });

    // Create a personal expense for the person who owed the money so it shows in their dashboard
    await Expense.create({
      owner: split.owedBy,
      title: expense.title,
      amount: split.amountOwed,
      category: expense.category,
      date: split.settledAt,
      description: `Settled share for shared expense: ${expense.title}`,
      isShared: false,
    });

    const isOwnerSettling = currentUserId === ownerId;
    const recipientId = isOwnerSettling ? split.owedBy : expense.owner;
    
    await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      expense: expense._id,
      type: "payment_received",
      title: isOwnerSettling ? "Share marked as paid" : "Payment received",
      message: isOwnerSettling 
        ? `${req.user.name} marked your share of "${expense.title}" as paid.`
        : `${req.user.name} paid their share for "${expense.title}".`
    });

    return successResponse(
      res,
      200,
      {
        settlement,
        expenseId,
        splitId,
      },
      "Split settled successfully"
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  settleSplit,
};

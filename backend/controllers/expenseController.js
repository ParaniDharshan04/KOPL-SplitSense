// server/controllers/expenseController.js
const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { EXPENSE_CATEGORIES, MAX_AMOUNT } = require("../utils/constants");
const { calculateEqualSplit, calculateCustomSplit } = require("../utils/splitCalculator");

/**
 * Checks if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates an amount to ensure it is a positive number and within limits
 * @param {any} amount - The amount to validate
 * @returns {string|null} Error message or null if valid
 */
const validateAmount = (amount) => {
  const num = Number(amount);

  if (Number.isNaN(num)) {
    return "Amount must be a valid number";
  }

  if (num <= 0) {
    return "Amount must be greater than zero";
  }

  if (num > MAX_AMOUNT) {
    return "Amount exceeds allowed limit";
  }

  return null;
};

/**
 * Checks the mandatory fields for an expense record
 * @param {Object} fields - Object containing title, amount, category
 * @returns {Object} An object with field-specific error messages, if any
 */
const checkExpenseFields = ({ title, amount, category }) => {
  const errors = {};

  if (!title) {
    errors.title = "Title is required";
  }

  const amountError = validateAmount(amount);
  if (amountError) {
    errors.amount = amountError;
  }

  if (!category) {
    errors.category = "Category is required";
  } else if (!EXPENSE_CATEGORIES.includes(category)) {
    errors.category = `Category must be one of [${EXPENSE_CATEGORIES.join(", ")}]`;
  }

  return errors;
};

/**
 * Helper function to determine if a date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if the date is in the future
 */
const buildFutureFlag = (date) => {
  return new Date(date).getTime() > Date.now();
};

/**
 * Creates a new personal expense record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createExpense = async (req, res, next) => {
  try {
    const { title, amount, category, date, description } = req.body;

    const errors = checkExpenseFields({ title, amount, category });
    if (Object.keys(errors).length > 0) {
      return errorResponse(res, 400, "ValidationError", JSON.stringify(errors));
    }

    const expenseDate = date ? new Date(date) : new Date();

    const expense = await Expense.create({
      owner: req.user._id,
      title: String(title).trim(),
      amount: Number(amount),
      category,
      date: expenseDate,
      description: description || "",
      isShared: false,
    });

    return successResponse(
      res,
      201,
      {
        expense,
        isFutureDate: buildFutureFlag(expense.date),
      },
      "Expense created successfully"
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * Fetches all personal expenses with optional category and date filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getExpenses = async (req, res, next) => {
  try {
    const { category, startDate, endDate } = req.query;

    const query = {
      owner: req.user._id,
      isDeleted: { $ne: true },
    };

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });

    return successResponse(res, 200, { expenses }, "Expenses fetched successfully");
  } catch (error) {
    return next(error);
  }
};

/**
 * Fetches a single expense record by its ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return errorResponse(res, 404, "NotFound", "Expense not found");
    }

    const expense = await Expense.findById(id)
      .populate("owner", "_id name email role")
      .populate("splitDetails.owedBy", "_id name email");

    if (!expense || expense.isDeleted) {
      return errorResponse(res, 404, "NotFound", "Expense not found");
    }

    const isOwner = String(expense.owner._id) === String(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 403, "Forbidden", "You are not allowed to access this expense");
    }

    return successResponse(
      res,
      200,
      {
        expense,
        isFutureDate: buildFutureFlag(expense.date),
      },
      "Expense fetched successfully"
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * Updates an existing personal expense record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, amount, category, date, description } = req.body;

    if (!isValidObjectId(id)) {
      return errorResponse(res, 404, "NotFound", "Expense not found");
    }

    const expense = await Expense.findById(id);
    if (!expense || expense.isDeleted) {
      return errorResponse(res, 404, "NotFound", "Expense not found");
    }

    if (String(expense.owner) !== String(req.user._id)) {
      return errorResponse(res, 403, "Forbidden", "You are not allowed to modify this expense");
    }

    if (expense.isShared) {
      return errorResponse(res, 400, "BadRequest", "Shared expenses must be managed through shared routes");
    }

    const errors = checkExpenseFields({
      title: title ?? expense.title,
      amount: amount ?? expense.amount,
      category: category ?? expense.category,
    });

    if (Object.keys(errors).length > 0) {
      return errorResponse(res, 400, "ValidationError", JSON.stringify(errors));
    }

    expense.title = String(title ?? expense.title).trim();
    expense.amount = Number(amount ?? expense.amount);
    expense.category = category ?? expense.category;
    expense.date = date ? new Date(date) : expense.date;
    expense.description = description ?? expense.description;

    await expense.save();

    return successResponse(
      res,
      200,
      {
        expense,
        isFutureDate: buildFutureFlag(expense.date),
      },
      "Expense updated successfully"
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * Deletes a specific expense. Soft-deletes if it's a shared expense with settlements.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return errorResponse(res, 404, "NotFound", "Expense not found");
    }

    const expense = await Expense.findById(id);
    if (!expense || expense.isDeleted) {
      return errorResponse(res, 404, "NotFound", "Expense not found");
    }

    if (String(expense.owner) !== String(req.user._id)) {
      return errorResponse(res, 403, "Forbidden", "You are not allowed to delete this expense");
    }

    if (expense.isShared) {
      const hasAnySettled = (expense.splitDetails || []).some((split) => split.isSettled);

      if (hasAnySettled) {
        const now = new Date();
        expense.isDeleted = true;
        expense.deletedAt = now;
        expense.splitDetails = (expense.splitDetails || []).map((split) => {
          if (!split.isSettled && !split.isCancelled) {
            return {
              ...split.toObject(),
              isCancelled: true,
              cancelledAt: now,
            };
          }
          return split;
        });

        await expense.save();

        return successResponse(
          res,
          200,
          { expenseId: expense._id, archived: true },
          "Shared expense archived and unsettled splits cancelled"
        );
      }
    }

    await expense.deleteOne();

    return successResponse(res, 200, { expenseId: id }, "Expense deleted successfully");
  } catch (error) {
    return next(error);
  }
};

/**
 * Deletes all personal expenses. Handles soft-deleting of shared expenses.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteAllExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ owner: req.user._id });

    for (const expense of expenses) {
      if (expense.isShared) {
        const hasAnySettled = (expense.splitDetails || []).some((split) => split.isSettled);

        if (hasAnySettled) {
          const now = new Date();
          expense.isDeleted = true;
          expense.deletedAt = now;
          expense.splitDetails = (expense.splitDetails || []).map((split) => {
            if (!split.isSettled && !split.isCancelled) {
              return {
                ...split.toObject(),
                isCancelled: true,
                cancelledAt: now,
              };
            }
            return split;
          });
          await expense.save();
        } else {
          await expense.deleteOne();
        }
      } else {
        await expense.deleteOne();
      }
    }

    return successResponse(res, 200, null, "All expenses deleted successfully");
  } catch (error) {
    return next(error);
  }
};

/**
 * Generates an expense summary (total spend, categories, monthly trend) for the dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getExpenseSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const match = {
      owner: new mongoose.Types.ObjectId(req.user._id),
      isDeleted: { $ne: true },
    };

    if (startDate || endDate) {
      match.date = {};
      if (startDate) {
        match.date.$gte = new Date(startDate);
      }
      if (endDate) {
        match.date.$lte = new Date(endDate);
      }
    }

    const [totals, categoryBreakdown, monthlyTrend, settledBack, paidToOthers] = await Promise.all([
      Expense.aggregate([
        { $match: match },
        { $group: { _id: null, totalSpend: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: match },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $project: { _id: 0, category: "$_id", total: 1 } },
        { $sort: { category: 1 } },
      ]),
      Expense.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
            },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        {
          $project: {
            _id: 0,
            month: {
              $concat: [
                { $toString: "$_id.year" },
                "-",
                {
                  $cond: [
                    { $lt: ["$_id.month", 10] },
                    { $concat: ["0", { $toString: "$_id.month" }] },
                    { $toString: "$_id.month" },
                  ],
                },
              ],
            },
            total: 1,
          },
        },
      ]),
      // Calculate total settled back by friends on your shared expenses
      // (splits where isSettled=true and owedBy is NOT the owner)
      Expense.aggregate([
        { $match: { ...match, isShared: true } },
        { $unwind: "$splitDetails" },
        {
          $match: {
            "splitDetails.isSettled": true,
            "splitDetails.owedBy": { $ne: new mongoose.Types.ObjectId(req.user._id) },
          },
        },
        {
          $group: {
            _id: null,
            totalSettledBack: { $sum: "$splitDetails.amountOwed" },
          },
        },
      ]),
    ]);

    const grossSpend = totals.length > 0 ? totals[0].totalSpend : 0;
    const baseCount = totals.length > 0 ? totals[0].count : 0;
    const totalSettledBack = settledBack.length > 0 ? settledBack[0].totalSettledBack : 0;

    // Net spend = gross spend minus what friends have settled back to you
    const totalSpend = Number((grossSpend - totalSettledBack).toFixed(2));
    const totalCount = baseCount;

    return successResponse(
      res,
      200,
      {
        totalSpend,
        totalCount,
        categoryBreakdown: categoryBreakdown || [],
        monthlyTrend: monthlyTrend || [],
      },
      "Expense summary fetched successfully"
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * Creates a shared expense and notifies participants. Supports equal or custom splits.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createSharedExpense = async (req, res, next) => {
  try {
    const { title, amount, category, date, description, splitWith, splitType, customAmounts = {} } = req.body;

    const errors = checkExpenseFields({ title, amount, category });
    if (!Array.isArray(splitWith) || splitWith.length === 0) {
      errors.splitWith = "Shared expense must involve at least one other user";
    }

    if (Object.keys(errors).length > 0) {
      return errorResponse(res, 400, "ValidationError", JSON.stringify(errors));
    }

    const ownerId = String(req.user._id);
    const ownerEmail = String(req.user.email || "").trim().toLowerCase();
    const normalizedSplitWith = [
      ...new Set(
        splitWith
          .map((email) => String(email).trim().toLowerCase())
          .filter((email) => email && email !== ownerEmail) // auto-exclude owner from the list, they're added automatically
      ),
    ];

    if (normalizedSplitWith.length === 0) {
      return errorResponse(res, 400, "BadRequest", "Shared expense must involve at least one other user besides yourself");
    }

    for (const email of normalizedSplitWith) {
      if (!emailRegex.test(email)) {
        return errorResponse(res, 400, "BadRequest", `User ${email} does not exist`);
      }
    }

    const allParticipants = [ownerEmail, ...normalizedSplitWith];
    const uniqueParticipants = [...new Set(allParticipants)];
    if (uniqueParticipants.length < 2) {
      return errorResponse(res, 400, "BadRequest", "Shared expense requires at least two unique participants");
    }

    const users = await User.find({ email: { $in: normalizedSplitWith } }).select("_id email name role");
    const usersByEmail = new Map(users.map((user) => [String(user.email).toLowerCase(), user]));

    for (const email of normalizedSplitWith) {
      if (!usersByEmail.has(email)) {
        return errorResponse(res, 400, "BadRequest", `User ${email} does not exist`);
      }
      if (usersByEmail.get(email).role === "admin") {
        return errorResponse(res, 400, "BadRequest", `Admin users cannot be added to a split`);
      }
    }

    const participantUserIds = normalizedSplitWith.map((email) => String(usersByEmail.get(email)._id));

    let splitDetails = [];
    if (splitType === "equal") {
      // GPay-style: split among all participants INCLUDING the owner
      // Owner's share is auto-marked as settled (paid)
      splitDetails = calculateEqualSplit(Number(amount), participantUserIds, ownerId);
    } else if (splitType === "custom") {
      const normalizedCustomAmounts = Object.fromEntries(
        Object.entries(customAmounts).map(([key, value]) => [String(key).trim().toLowerCase(), value])
      );
      const normalizedCustom = {};
      for (const email of normalizedSplitWith) {
        if (normalizedCustomAmounts[email] === undefined) {
          return errorResponse(res, 400, "BadRequest", "Split amounts do not add up to total");
        }

        const userId = String(usersByEmail.get(email)._id);
        normalizedCustom[userId] = Number(normalizedCustomAmounts[email]);
      }
      // Include owner's share in custom split if provided
      if (normalizedCustomAmounts[ownerEmail] !== undefined) {
        normalizedCustom[ownerId] = Number(normalizedCustomAmounts[ownerEmail]);
      }
      splitDetails = calculateCustomSplit(Number(amount), normalizedCustom, ownerId);
    } else {
      return errorResponse(res, 400, "BadRequest", "splitType must be equal or custom");
    }

    const expense = await Expense.create({
      owner: req.user._id,
      title: String(title).trim(),
      amount: Number(amount),
      category,
      date: date ? new Date(date) : new Date(),
      description: description || "",
      isShared: true,
      splitDetails,
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate("owner", "_id name email")
      .populate("splitDetails.owedBy", "_id name email");

    const amountByUserId = new Map(
      expense.splitDetails.map((split) => [String(split.owedBy), Number(split.amountOwed || 0)])
    );

    // Only notify other users, not the owner themselves
    const notifications = users
      .filter((user) => String(user._id) !== ownerId)
      .map((user) => {
        const owedAmount = amountByUserId.get(String(user._id)) || 0;
        return {
          recipient: user._id,
          sender: req.user._id,
          expense: expense._id,
          title: "New shared expense",
          message: `${req.user.name} added you to \"${title}\". Your share is ${owedAmount.toFixed(2)}.`,
        };
      });

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return successResponse(
      res,
      201,
      {
        expense: populatedExpense,
        isFutureDate: buildFutureFlag(expense.date),
      },
      "Shared expense created successfully"
    );
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.statusCode, "BadRequest", error.message);
    }
    return next(error);
  }
};

/**
 * Retrieves all pending split amounts that other users owe to the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getOwedToMe = async (req, res, next) => {
  try {
    const expenses = await Expense.find({
      owner: req.user._id,
      isShared: true,
      isDeleted: { $ne: true },
      splitDetails: { $elemMatch: { isSettled: false, isCancelled: false } },
    })
      .populate("splitDetails.owedBy", "_id name email")
      .sort({ createdAt: -1 });

    const result = expenses.map((expense) => {
      const pendingSplits = expense.splitDetails.filter((split) => !split.isSettled && !split.isCancelled);
      const totalPending = pendingSplits.reduce((sum, split) => sum + split.amountOwed, 0);
      return {
        expense,
        pendingSplits,
        totalPending,
      };
    });

    return successResponse(res, 200, { owedToMe: result }, "Shared receivables fetched successfully");
  } catch (error) {
    return next(error);
  }
};

/**
 * Retrieves all pending split amounts that the authenticated user owes to others
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getIOwe = async (req, res, next) => {
  try {
    const expenses = await Expense.find({
      isShared: true,
      isDeleted: { $ne: true },
      splitDetails: {
        $elemMatch: {
          owedBy: req.user._id,
          isSettled: false,
          isCancelled: false,
        },
      },
    })
      .populate("owner", "_id name email")
      .populate("splitDetails.owedBy", "_id name email")
      .sort({ createdAt: -1 });

    const result = expenses.map((expense) => {
      const mySplits = expense.splitDetails.filter(
        (split) => String(split.owedBy._id || split.owedBy) === String(req.user._id) && !split.isSettled && !split.isCancelled
      );
      const totalPending = mySplits.reduce((sum, split) => sum + split.amountOwed, 0);

      return {
        expense,
        mySplits,
        totalPending,
      };
    });

    return successResponse(res, 200, { iOwe: result }, "Shared payables fetched successfully");
  } catch (error) {
    return next(error);
  }
};

/**
 * Computes a simplified net balance ledger for the user against all other users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getBalances = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ isShared: true, isDeleted: { $ne: true } })
      .populate("owner", "_id name email")
      .populate("splitDetails.owedBy", "_id name email");

    const directionalLedger = new Map();
    const usersMap = new Map();

    expenses.forEach((expense) => {
      const ownerId = String(expense.owner._id);
      usersMap.set(ownerId, expense.owner);

      expense.splitDetails.forEach((split) => {
        if (split.isSettled || split.isCancelled) {
          return;
        }

        const debtorId = String(split.owedBy._id || split.owedBy);
        if (debtorId === ownerId) {
          return;
        }

        usersMap.set(debtorId, split.owedBy);

        const key = `${debtorId}->${ownerId}`;
        directionalLedger.set(key, (directionalLedger.get(key) || 0) + Number(split.amountOwed));
      });
    });

    const processed = new Set();
    const netBalances = [];

    for (const [key, amount] of directionalLedger.entries()) {
      if (processed.has(key)) {
        continue;
      }

      const [from, to] = key.split("->");
      const reverseKey = `${to}->${from}`;
      const reverse = directionalLedger.get(reverseKey) || 0;

      processed.add(key);
      processed.add(reverseKey);

      const net = Number((amount - reverse).toFixed(2));
      if (net === 0) {
        continue;
      }

      if (from !== String(req.user._id) && to !== String(req.user._id)) {
        continue;
      }

      if (net > 0) {
        netBalances.push({
          from: usersMap.get(from),
          to: usersMap.get(to),
          amount: net,
          direction: `${from} owes ${to}`,
        });
      } else {
        netBalances.push({
          from: usersMap.get(to),
          to: usersMap.get(from),
          amount: Math.abs(net),
          direction: `${to} owes ${from}`,
        });
      }
    }

    return successResponse(res, 200, { balances: netBalances }, "Net balances fetched successfully");
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  deleteAllExpenses,
  getExpenseSummary,
  createSharedExpense,
  getOwedToMe,
  getIOwe,
  getBalances,
};

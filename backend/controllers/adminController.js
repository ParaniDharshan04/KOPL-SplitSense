// server/controllers/adminController.js
const mongoose = require("mongoose");
const User = require("../models/User");
const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");
const RefreshToken = require("../models/RefreshToken");
const { successResponse, errorResponse } = require("../utils/apiResponse");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Fetches all registered users (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("_id name email role createdAt updatedAt").sort({ createdAt: -1 });
    return successResponse(res, 200, { users }, "Users fetched successfully");
  } catch (error) {
    return next(error);
  }
};

/**
 * Fetches all expenses across all users (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAllExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find()
      .populate("owner", "_id name email role")
      .populate("splitDetails.owedBy", "_id name email")
      .sort({ createdAt: -1 });

    return successResponse(res, 200, { expenses }, "All expenses fetched successfully");
  } catch (error) {
    return next(error);
  }
};

/**
 * Generates summary statistics for the admin dashboard
 * Includes user counts, total spends, and top categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAdminSummary = async (req, res, next) => {
  try {
    const [
      userCount,
      expenseStats,
      sharedStats,
      settlementStats,
      topCategories,
    ] = await Promise.all([
      User.countDocuments(),
      Expense.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            totalSpend: { $sum: "$amount" },
            totalExpenses: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { isShared: true, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: null,
            sharedCount: { $sum: 1 },
            sharedTotal: { $sum: "$amount" },
          },
        },
      ]),
      Settlement.aggregate([
        {
          $lookup: {
            from: "expenses",
            localField: "expenseId",
            foreignField: "_id",
            as: "expense",
          },
        },
        { $unwind: "$expense" },
        {
          $match: {
            "expense.isShared": true,
            "expense.isDeleted": { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            settledCount: { $sum: 1 },
            settledAmount: { $sum: "$amount" },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, category: "$_id", total: 1 } },
      ]),
    ]);

    const expenseBase = expenseStats[0] || { totalSpend: 0, totalExpenses: 0 };
    const sharedBase = sharedStats[0] || { sharedCount: 0, sharedTotal: 0 };
    const settlementBase = settlementStats[0] || { settledCount: 0, settledAmount: 0 };

    return successResponse(
      res,
      200,
      {
        users: userCount,
        totalExpenses: expenseBase.totalExpenses,
        totalSpend: expenseBase.totalSpend,
        sharedExpenses: sharedBase.sharedCount,
        sharedSpend: sharedBase.sharedTotal,
        settlements: settlementBase.settledCount,
        settledAmount: settlementBase.settledAmount,
        topCategories,
      },
      "Admin summary fetched successfully"
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * Deletes a user and all their associated data (expenses, tokens, settlements)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 404, "NotFound", "User not found");
    }

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 404, "NotFound", "User not found");
    }

    await Promise.all([
      Expense.deleteMany({ owner: id }),
      RefreshToken.deleteMany({ user: id }),
      Settlement.deleteMany({ $or: [{ settledBy: id }, { settledTo: id }] }),
      User.findByIdAndDelete(id),
    ]);

    return successResponse(res, 200, { userId: id }, "User removed successfully");
  } catch (error) {
    return next(error);
  }
};

/**
 * Updates a user's basic information or role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 404, "NotFound", "User not found");
    }

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 404, "NotFound", "User not found");
    }

    const updates = {};

    if (name !== undefined) {
      const normalizedName = String(name).trim();
      if (!normalizedName) {
        return errorResponse(res, 400, "BadRequest", "Name is required");
      }
      updates.name = normalizedName;
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!emailRegex.test(normalizedEmail)) {
        return errorResponse(res, 400, "BadRequest", "Invalid email format");
      }

      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: id } }).select("_id");
      if (existing) {
        return errorResponse(res, 409, "Conflict", "Email already registered");
      }

      updates.email = normalizedEmail;
    }

    if (role !== undefined) {
      if (!["user", "admin"].includes(role)) {
        return errorResponse(res, 400, "BadRequest", "Role must be user or admin");
      }
      updates.role = role;
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, 400, "BadRequest", "No valid fields to update");
    }

    Object.assign(user, updates);
    await user.save();

    return successResponse(
      res,
      200,
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      "User updated successfully"
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllUsers,
  getAllExpenses,
  getAdminSummary,
  updateUser,
  deleteUser,
};

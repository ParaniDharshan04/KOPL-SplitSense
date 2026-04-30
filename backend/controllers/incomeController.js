// server/controllers/incomeController.js
const mongoose = require("mongoose");
const Income = require("../models/Income");
const { INCOME_CATEGORIES } = require("../models/Income");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { MAX_AMOUNT } = require("../utils/constants");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

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

const checkIncomeFields = ({ title, amount, category }) => {
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
  } else if (!INCOME_CATEGORIES.includes(category)) {
    errors.category = `Category must be one of [${INCOME_CATEGORIES.join(", ")}]`;
  }

  return errors;
};

const createIncome = async (req, res, next) => {
  try {
    const { title, amount, category, date, description } = req.body;

    const errors = checkIncomeFields({ title, amount, category });
    if (Object.keys(errors).length > 0) {
      return errorResponse(res, 400, "ValidationError", JSON.stringify(errors));
    }

    const incomeDate = date ? new Date(date) : new Date();

    const income = await Income.create({
      owner: req.user._id,
      title: String(title).trim(),
      amount: Number(amount),
      category,
      date: incomeDate,
      description: description || "",
    });

    return successResponse(res, 201, { income }, "Income created successfully");
  } catch (error) {
    return next(error);
  }
};

const getIncomes = async (req, res, next) => {
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

    const incomes = await Income.find(query).sort({ date: -1, createdAt: -1 });

    return successResponse(res, 200, { incomes }, "Incomes fetched successfully");
  } catch (error) {
    return next(error);
  }
};

const getIncomeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return errorResponse(res, 404, "NotFound", "Income not found");
    }

    const income = await Income.findById(id).populate("owner", "_id name email role");

    if (!income || income.isDeleted) {
      return errorResponse(res, 404, "NotFound", "Income not found");
    }

    const isOwner = String(income.owner._id) === String(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 403, "Forbidden", "You are not allowed to access this income");
    }

    return successResponse(res, 200, { income }, "Income fetched successfully");
  } catch (error) {
    return next(error);
  }
};

const updateIncome = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, amount, category, date, description } = req.body;

    if (!isValidObjectId(id)) {
      return errorResponse(res, 404, "NotFound", "Income not found");
    }

    const income = await Income.findById(id);
    if (!income || income.isDeleted) {
      return errorResponse(res, 404, "NotFound", "Income not found");
    }

    if (String(income.owner) !== String(req.user._id)) {
      return errorResponse(res, 403, "Forbidden", "You are not allowed to modify this income");
    }

    const errors = checkIncomeFields({
      title: title ?? income.title,
      amount: amount ?? income.amount,
      category: category ?? income.category,
    });

    if (Object.keys(errors).length > 0) {
      return errorResponse(res, 400, "ValidationError", JSON.stringify(errors));
    }

    income.title = String(title ?? income.title).trim();
    income.amount = Number(amount ?? income.amount);
    income.category = category ?? income.category;
    income.date = date ? new Date(date) : income.date;
    income.description = description ?? income.description;

    await income.save();

    return successResponse(res, 200, { income }, "Income updated successfully");
  } catch (error) {
    return next(error);
  }
};

const deleteIncome = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return errorResponse(res, 404, "NotFound", "Income not found");
    }

    const income = await Income.findById(id);
    if (!income || income.isDeleted) {
      return errorResponse(res, 404, "NotFound", "Income not found");
    }

    if (String(income.owner) !== String(req.user._id)) {
      return errorResponse(res, 403, "Forbidden", "You are not allowed to delete this income");
    }

    await income.deleteOne();

    return successResponse(res, 200, { incomeId: id }, "Income deleted successfully");
  } catch (error) {
    return next(error);
  }
};

const getIncomeSummary = async (req, res, next) => {
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

    const [totals, categoryBreakdown, monthlyTrend] = await Promise.all([
      Income.aggregate([
        { $match: match },
        { $group: { _id: null, totalIncome: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Income.aggregate([
        { $match: match },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        { $project: { _id: 0, category: "$_id", total: 1 } },
        { $sort: { category: 1 } },
      ]),
      Income.aggregate([
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
    ]);

    const totalIncome = totals.length > 0 ? totals[0].totalIncome : 0;
    const totalCount = totals.length > 0 ? totals[0].count : 0;

    return successResponse(
      res,
      200,
      {
        totalIncome,
        totalCount,
        categoryBreakdown: categoryBreakdown || [],
        monthlyTrend: monthlyTrend || [],
      },
      "Income summary fetched successfully"
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createIncome,
  getIncomes,
  getIncomeById,
  updateIncome,
  deleteIncome,
  getIncomeSummary,
};

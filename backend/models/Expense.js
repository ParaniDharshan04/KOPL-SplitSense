// server/models/Expense.js
const mongoose = require("mongoose");
const { EXPENSE_CATEGORIES } = require("../utils/constants");

const splitDetailsSchema = new mongoose.Schema(
  {
    owedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amountOwed: {
      type: Number,
      required: true,
      min: 0,
    },
    isSettled: {
      type: Boolean,
      default: false,
    },
    settledAt: {
      type: Date,
    },
    isCancelled: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
    },
  },
  { _id: true }
);

const expenseSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than zero"],
    },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      required: [true, "Category is required"],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    splitDetails: {
      type: [splitDetailsSchema],
      default: undefined,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Expense", expenseSchema);

// server/models/Settlement.js
const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema({
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Expense",
    required: true,
  },
  settledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  settledTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  settledAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Settlement", settlementSchema);

// server/routes/expenseRoutes.js
const express = require("express");
const { body } = require("express-validator");
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
  createSharedExpense,
  getOwedToMe,
  getIOwe,
  getBalances,
} = require("../controllers/expenseController");
const { protect } = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");

const router = express.Router();

router.use(protect);

const baseExpenseValidators = [
  body("title").optional().trim().notEmpty().withMessage("Title is required"),
  body("amount").optional().isNumeric().withMessage("Amount must be a valid number"),
  body("category").optional().trim().notEmpty().withMessage("Category is required"),
];

router.get("/summary", getExpenseSummary);

router.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("amount").isNumeric().withMessage("Amount must be a valid number"),
    body("category").trim().notEmpty().withMessage("Category is required"),
  ],
  validateRequest,
  createExpense
);

router.get("/", getExpenses);

router.post(
  "/shared",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("amount").isNumeric().withMessage("Amount must be a valid number"),
    body("category").trim().notEmpty().withMessage("Category is required"),
    body("splitWith").isArray({ min: 1 }).withMessage("Shared expense must involve at least one other user"),
    body("splitWith.*").isEmail().withMessage("splitWith must contain valid emails"),
    body("splitType").isIn(["equal", "custom"]).withMessage("splitType must be equal or custom"),
  ],
  validateRequest,
  createSharedExpense
);

router.get("/shared/owed-to-me", getOwedToMe);
router.get("/shared/i-owe", getIOwe);
router.get("/balances", getBalances);

router.get("/:id", getExpenseById);
router.put("/:id", baseExpenseValidators, validateRequest, updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;

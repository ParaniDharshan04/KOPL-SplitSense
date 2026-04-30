// server/routes/incomeRoutes.js
const express = require("express");
const { body } = require("express-validator");
const {
  createIncome,
  getIncomes,
  getIncomeById,
  updateIncome,
  deleteIncome,
  getIncomeSummary,
} = require("../controllers/incomeController");
const { protect } = require("../middleware/authMiddleware");
const { validateRequest } = require("../middleware/validateRequest");

const router = express.Router();

router.use(protect);

const baseIncomeValidators = [
  body("title").optional().trim().notEmpty().withMessage("Title is required"),
  body("amount").optional().isNumeric().withMessage("Amount must be a valid number"),
  body("category").optional().trim().notEmpty().withMessage("Category is required"),
];

router.get("/summary", getIncomeSummary);

router.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("amount").isNumeric().withMessage("Amount must be a valid number"),
    body("category").trim().notEmpty().withMessage("Category is required"),
  ],
  validateRequest,
  createIncome
);

router.get("/", getIncomes);

router.get("/:id", getIncomeById);
router.put("/:id", baseIncomeValidators, validateRequest, updateIncome);
router.delete("/:id", deleteIncome);

module.exports = router;

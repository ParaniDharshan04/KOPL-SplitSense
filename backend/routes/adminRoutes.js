// server/routes/adminRoutes.js
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");
const {
  getAllUsers,
  getAllExpenses,
  getAdminSummary,
  updateUser,
  deleteUser,
} = require("../controllers/adminController");

const router = express.Router();

router.use(protect);
router.use(restrictTo("admin"));

router.get("/users", getAllUsers);
router.get("/expenses", getAllExpenses);
router.get("/summary", getAdminSummary);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

module.exports = router;

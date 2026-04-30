// server/routes/settlementRoutes.js
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { settleSplit } = require("../controllers/settlementController");

const router = express.Router();

router.use(protect);

router.post("/:expenseId/settle/:splitId", settleSplit);

module.exports = router;

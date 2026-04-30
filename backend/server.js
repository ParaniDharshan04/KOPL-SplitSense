// server/server.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const settlementRoutes = require("./routes/settlementRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

dotenv.config();

const app = express();

const {
  NODE_ENV = "development",
  PORT = 5000,
  MONGO_URI,
  CLIENT_ORIGIN,
} = process.env;

// Security headers for common browser attack protections.
app.use(helmet());

// CORS restricted to frontend origin from environment.
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);

// Parse request payloads.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Sanitize request data against NoSQL injection payloads.
app.use(mongoSanitize());

// Liveness probe and quick API sanity check.
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      uptime: process.uptime(),
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
    },
    message: "Expense Tracker API is healthy",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/settlements", settlementRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/income", incomeRoutes);

// Unknown route handler in required API error shape.
app.use(notFoundHandler);

// Centralized error handler.
app.use(errorHandler);

const connectDatabase = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not configured in environment variables");
    }

    await mongoose.connect(MONGO_URI);

    app.listen(PORT, () => {
      // Keep startup log concise for ops visibility.
      console.log(`Server running on port ${PORT} (${NODE_ENV})`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

connectDatabase();

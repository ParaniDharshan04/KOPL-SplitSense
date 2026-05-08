// server/middleware/errorHandler.js
const { errorResponse } = require("../utils/apiResponse");

/**
 * Middleware to handle requests to non-existent routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFoundHandler = (req, res) => {
  return errorResponse(res, 404, "Route not found", `Cannot ${req.method} ${req.originalUrl}`);
};

/**
 * Global error handling middleware
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  return errorResponse(
    res,
    statusCode,
    error.name || "ServerError",
    process.env.NODE_ENV === "production" && statusCode === 500 ? "Internal server error" : message
  );
};

module.exports = {
  notFoundHandler,
  errorHandler,
};

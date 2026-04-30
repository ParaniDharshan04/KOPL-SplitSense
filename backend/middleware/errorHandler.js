// server/middleware/errorHandler.js
const { errorResponse } = require("../utils/apiResponse");

const notFoundHandler = (req, res) => {
  return errorResponse(res, 404, "Route not found", `Cannot ${req.method} ${req.originalUrl}`);
};

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

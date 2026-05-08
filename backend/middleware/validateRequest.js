// server/middleware/validateRequest.js
const { validationResult } = require("express-validator");
const { errorResponse } = require("../utils/apiResponse");

/**
 * Middleware to format and return express-validator validation errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const mapped = {};
  errors.array().forEach((item) => {
    if (!mapped[item.path]) {
      mapped[item.path] = item.msg;
    }
  });

  return errorResponse(res, 400, "ValidationError", JSON.stringify(mapped));
};

module.exports = {
  validateRequest,
};

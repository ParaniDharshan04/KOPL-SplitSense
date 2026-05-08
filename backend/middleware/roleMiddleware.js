// server/middleware/roleMiddleware.js
const { errorResponse } = require("../utils/apiResponse");

/**
 * Middleware to restrict route access to specific user roles
 * @param {...string} roles - Allowed roles (e.g., 'admin')
 * @returns {Function} Express middleware function
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(res, 403, "Forbidden", "You are not allowed to perform this action");
    }

    return next();
  };
};

module.exports = {
  restrictTo,
};

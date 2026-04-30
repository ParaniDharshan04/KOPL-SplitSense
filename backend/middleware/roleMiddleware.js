// server/middleware/roleMiddleware.js
const { errorResponse } = require("../utils/apiResponse");

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

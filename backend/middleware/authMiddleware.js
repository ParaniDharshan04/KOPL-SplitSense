// server/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { errorResponse } = require("../utils/apiResponse");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, 401, "Unauthorized", "No token provided");
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.userId).select("_id name email role");
      if (!user) {
        return errorResponse(res, 401, "Unauthorized", "Invalid token");
      }

      req.user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      return next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return errorResponse(res, 401, "Unauthorized", "Token expired, please login again");
      }

      return errorResponse(res, 401, "Unauthorized", "Invalid token");
    }
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  protect,
};

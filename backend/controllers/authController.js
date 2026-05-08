// server/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/token");

/**
 * Helper to calculate token expiry date based on JWT payload
 * @param {string} token - The decoded JWT
 * @returns {Date} The expiration date
 */
const getTokenExpiryDate = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.exp) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  return new Date(decoded.exp * 1000);
};

/**
 * Registers a new user account and returns auth tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existingUser) {
      return errorResponse(res, 409, "Conflict", "Email already registered");
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      passwordHash,
      role: "user",
    });

    const payload = { userId: user._id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: getTokenExpiryDate(refreshToken),
    });

    return successResponse(
      res,
      201,
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      "User registered successfully"
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * Authenticates a user and returns new access & refresh tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+passwordHash");
    if (!user) {
      return errorResponse(res, 401, "Unauthorized", "Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return errorResponse(res, 401, "Unauthorized", "Invalid credentials");
    }

    const payload = { userId: user._id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: getTokenExpiryDate(refreshToken),
    });

    return successResponse(
      res,
      200,
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      "Login successful"
    );
  } catch (error) {
    return next(error);
  }
};

/**
 * Logs out a user by revoking their refresh token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 400, "BadRequest", "Refresh token is required");
    }

    await RefreshToken.findOneAndUpdate({ token: refreshToken }, { isRevoked: true });

    return successResponse(res, 200, {}, "Logout successful");
  } catch (error) {
    return next(error);
  }
};

/**
 * Generates a new access token using a valid refresh token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 400, "BadRequest", "Refresh token is required");
    }

    const tokenRecord = await RefreshToken.findOne({ token: refreshToken, isRevoked: false });
    if (!tokenRecord) {
      return errorResponse(res, 401, "Unauthorized", "Invalid refresh token");
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return errorResponse(res, 401, "Unauthorized", "Refresh token expired, please login again");
      }

      return errorResponse(res, 401, "Unauthorized", "Invalid refresh token");
    }

    const user = await User.findById(decoded.userId).select("_id name email role");
    if (!user) {
      return errorResponse(res, 401, "Unauthorized", "Invalid refresh token");
    }

    const accessToken = generateAccessToken({ userId: user._id, role: user.role });

    return successResponse(
      res,
      200,
      {
        accessToken,
      },
      "Token refreshed successfully"
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refresh,
};

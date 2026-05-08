// server/utils/token.js
const jwt = require("jsonwebtoken");

/**
 * Generates a short-lived JSON Web Token for API access
 * @param {Object} payload - Data to encode in the token
 * @returns {string} Signed JWT access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  });
};

/**
 * Generates a long-lived JSON Web Token for refreshing access
 * @param {Object} payload - Data to encode in the token
 * @returns {string} Signed JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  });
};

/**
 * Verifies a refresh token against the secret
 * @param {string} token - The refresh token to verify
 * @returns {Object} Decoded payload if valid
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
};

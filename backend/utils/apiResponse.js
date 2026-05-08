// server/utils/apiResponse.js
/**
 * Formats and sends a successful API response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {any} data - Payload to send
 * @param {string} message - Success message
 * @returns {Object} JSON response
 */
const successResponse = (res, statusCode, data, message) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

/**
 * Formats and sends an error API response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {any} error - Error details or type
 * @param {string} message - Error message
 * @returns {Object} JSON response
 */
const errorResponse = (res, statusCode, error, message) => {
  return res.status(statusCode).json({
    success: false,
    error,
    message,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};

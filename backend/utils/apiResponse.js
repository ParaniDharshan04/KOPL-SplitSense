// server/utils/apiResponse.js
const successResponse = (res, statusCode, data, message) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

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

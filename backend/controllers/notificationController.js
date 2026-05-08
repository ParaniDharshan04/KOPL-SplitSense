const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const { successResponse, errorResponse } = require("../utils/apiResponse");

/**
 * Fetches all notifications for the currently authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "_id name email")
      .populate("expense", "_id title amount date")
      .sort({ createdAt: -1 })
      .limit(50);

    return successResponse(res, 200, { notifications }, "Notifications fetched successfully");
  } catch (error) {
    return next(error);
  }
};

/**
 * Marks a specific notification as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 404, "NotFound", "Notification not found");
    }

    const notification = await Notification.findOne({ _id: id, recipient: req.user._id });
    if (!notification) {
      return errorResponse(res, 404, "NotFound", "Notification not found");
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return successResponse(res, 200, { notification }, "Notification updated successfully");
  } catch (error) {
    return next(error);
  }
};

/**
 * Deletes a specific notification permanently
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 404, "NotFound", "Notification not found");
    }

    const notification = await Notification.findOneAndDelete({ _id: id, recipient: req.user._id });
    if (!notification) {
      return errorResponse(res, 404, "NotFound", "Notification not found");
    }

    return successResponse(res, 200, { notificationId: id }, "Notification deleted successfully");
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMyNotifications,
  markNotificationRead,
  deleteNotification,
};

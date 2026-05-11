// app/modules/notification/notification.controller.ts
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { NotificationService } from "./notification.service";

const sendNotification = catchAsync(async (req, res) => {
  const { userIds, title, message } = req.body;

  const result = await NotificationService.sendNotification({
    userIds,
    title,
    message,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Push notifications processed",
    data: result,
  });
});

const getMyNotifications = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const data = await NotificationService.getMyNotifications(userId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Notifications fetched successfully",
    data,
  });
});

const markRead = catchAsync(async (req, res) => {
  const result = await NotificationService.markAsRead(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Notification marked as read",
    data: result,
  });
});

export const NotificationController = {
  sendNotification,
  getMyNotifications,
  markRead,
};

/* eslint-disable @typescript-eslint/no-explicit-any */
// app/modules/notification/notification.service.ts
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { Notification } from "./notification.model";
import Expo from "expo-server-sdk";
import { Accounts } from "../accounts/accounts.model";
import { io } from "../../socket";

const expo = new Expo();

const sendNotification = async (payload: any) => {
  const { userIds, title, message } = payload;

  const users = await Accounts.find({ _id: { $in: userIds } }).select(
    "_id expoPushToken"
  );

  if (!users || users.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "No users found for provided ids");
  }

  const createdNotification = await Notification.create({
    to: users.map((u) => u._id),
    title,
    message,
    deliveryStatus: "pending",
  });

  // Expo push (unchanged)
  const messages: any[] = [];
  for (const user of users) {
    if (!user.expoPushToken || !Expo.isExpoPushToken(user.expoPushToken)) {
      continue;
    }

    messages.push({
      to: user.expoPushToken,
      sound: "default",
      title,
      body: message,
    });
  }

  let successCount = 0;
  let failCount = 0;
  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      for (const ticket of ticketChunk) {
        if (ticket.status === "ok") successCount++;
        else failCount++;
      }
    } catch (error) {
      console.error("Error sending Expo chunk:", error);
      failCount += chunk.length;
    }
  }

  const overallStatus =
    successCount === 0 ? "failed" : failCount > 0 ? "partial" : "sent";

  await Notification.updateOne(
    { _id: createdNotification._id },
    { $set: { deliveryStatus: overallStatus } }
  );

  // 🔥 REAL-TIME SOCKET EMIT (THIS WAS MISSING)
  users.forEach((user) => {
    io.to(user._id.toString()).emit("new-notification", {
      _id: createdNotification._id,
      title,
      message,
      createdAt: createdNotification.createdAt,
    });
  });

  return {
    notificationId: createdNotification._id,
    createdNotificationsCount: 1,
    pushedCount: successCount,
    failedCount: failCount,
    deliveryStatus: overallStatus,
  };
};

const getMyNotifications = async (userId: string) => {
  return Notification.find({ to: userId }).sort({ createdAt: -1 });
};

const markAsRead = async (id: string) => {
  return Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
};

export const NotificationService = {
  sendNotification,
  getMyNotifications,
  markAsRead,
};

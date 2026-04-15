/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from "../modules/auth/auth.model";
import { Notification } from "../modules/notification/notification.model";
import { io } from "../../server";

export const sendNotificationToMultipleUsers = async (
  userIds: any[],
  title: string,
  message: string
) => {
  if (!userIds.length) return;

  // 1️⃣ Fetch users
  const users = await User.find({ _id: { $in: userIds } }).select("_id");

  if (!users.length) return;

  // 2️⃣ Save ONE notification entry
  const createdNotification = await Notification.create({
    to: users.map((u) => u._id),
    title,
    message,
    deliveryStatus: "pending",
  });

  // 3️⃣ Emit socket event ONLY to intended users
  users.forEach((user) => {
    io.to(user._id.toString()).emit("new-notification", {
      _id: createdNotification._id,
      title,
      message,
      createdAt: createdNotification.createdAt,
    });
  });
};

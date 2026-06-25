import Expo from "expo-server-sdk";
import mongoose from "mongoose";
import { Accounts } from "../modules/accounts/accounts.model";
import { Notification } from "../modules/notification/notification.model";
import { io } from "../socket";

const expo = new Expo();
console.log(expo);

//Send a single-user Expo notification
export const sendSingleNotification = async (
  userId: mongoose.Types.ObjectId,
  title: string,
  message: string
) => {
  const user = await Accounts.findById(userId).select("expoPushToken");
  if (!user) return;

  const token = user.expoPushToken;
  console.log(token);
  // if (!Expo.isExpoPushToken(token)) return;

  // Save notification to DB
  await Notification.create({
    to: [userId],
    title,
    message,
    deliveryStatus: "pending",
  });

  // Send the push
  // await expo.sendPushNotificationsAsync([
  //   {
  //     to: token,
  //     sound: "default",
  //     title,
  //     body: message,
  //   },
  // ]);

  // Emit via Socket.io
  io.to(userId.toString()).emit("new-notification", {
    title,
    message,
    createdAt: Date.now(),
  });
};
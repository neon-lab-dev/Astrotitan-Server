import Expo from "expo-server-sdk";
import mongoose from "mongoose";
import { Accounts } from "../modules/accounts/accounts.model";
import { Notification } from "../modules/notification/notification.model";
import { io, userSocketMap } from "../socket";

const expo = new Expo();

// Send a single-user Expo notification
export const sendSingleNotification = async (
  userId: mongoose.Types.ObjectId | string,
  title: string,
  message: string
) => {
  try {
    const user = await Accounts.findById(userId).select("expoPushToken");
    if (!user) {
      console.log(`❌ User not found: ${userId}`);
      return;
    }

    const token = user.expoPushToken;
    console.log(`📱 Expo Push Token: ${token}`);

    // Save notification to DB
    await Notification.create({
      to: [userId],
      title,
      message,
      deliveryStatus: "pending",
    });

    // Send Expo push notification (if token exists)
    if (token && Expo.isExpoPushToken(token)) {
      try {
        await expo.sendPushNotificationsAsync([
          {
            to: token,
            sound: "default",
            title,
            body: message,
          },
        ]);
        console.log(`✅ Expo push sent to: ${userId}`);
      } catch (pushError) {
        console.error(`❌ Expo push failed:`, pushError);
      }
    }

    // ✅ Emit via Socket.io - Get the socket ID from userSocketMap
    const socketId = userSocketMap.get(userId.toString());
    if (socketId && io) {
      io.to(socketId).emit("new-notification", {
        title,
        message,
        createdAt: new Date().toISOString(),
        userId: userId.toString(),
      });
      console.log(`✅ Socket notification sent to: ${userId} (Socket ID: ${socketId})`);
    } else {
      console.log(`⚠️ Socket not found for user: ${userId}`);
      console.log(`📊 Available sockets:`, Array.from(userSocketMap.keys()));
    }

  } catch (error) {
    console.error(`❌ Error sending notification:`, error);
  }
};
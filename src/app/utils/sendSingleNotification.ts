/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { Accounts } from "../modules/accounts/accounts.model";
import { Notification } from "../modules/notification/notification.model";
import { io, userSocketMap } from "../socket";
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import type { ServiceAccount } from 'firebase-admin';

// Initialize Firebase Admin only once
if (!getApps().length) {
  try {
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    initializeApp({
      credential: cert(serviceAccount),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
  }
}

// Get messaging instance
const messaging = getMessaging();

// Function to send notification to a specific device
export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  message: string,
  data?: any,
) => {
  if (!fcmToken) {
    console.log('⚠️ No FCM token provided');
    return;
  }

  const payload = {
    notification: {
      title: title,
      body: message,
    },
    data: data || {},
    token: fcmToken,
  };

  try {
    const response = await messaging.send(payload);
    console.log('Successfully sent notification:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Error sending notification:', error);
    
    // Handle specific FCM errors
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.log('⚠️ Invalid FCM token, removing from database');
      await Accounts.findOneAndUpdate(
        { pushToken: fcmToken },
        { $unset: { pushToken: "" } }
      );
    }
    throw error;
  }
};

// Send a single-user notification
export const sendSingleNotification = async (
  userId: mongoose.Types.ObjectId | string,
  title: string,
  message: string
) => {
  try {
    const user = await Accounts.findById(userId).select("pushToken");
    if (!user) {
      console.log(`❌ User not found: ${userId}`);
      return;
    }

    const token = user.pushToken;
    console.log(`📱 Push Token: ${token}`);

    // Save notification to DB
    await Notification.create({
      to: [userId],
      title,
      message,
      deliveryStatus: "pending",
    });

    // Send push notification (if token exists)
    if (token) {
      try {
        await sendPushNotification(token, title, message, { userId: userId.toString() });
        console.log(`Push notification sent to: ${userId}`);
      } catch (pushError) {
        console.error(`❌ Push notification failed:`, pushError);
      }
    }

    // Emit via Socket.io - Real-time notification
    const socketId = userSocketMap.get(userId.toString());
    if (socketId && io) {
      io.to(socketId).emit("new-notification", {
        title,
        message,
        createdAt: new Date().toISOString(),
        userId: userId.toString(),
      });
      console.log(`Socket notification sent to: ${userId} (Socket ID: ${socketId})`);
    } else {
      console.log(`⚠️ Socket not found for user: ${userId}`);
      console.log(`📊 Available sockets:`, Array.from(userSocketMap.keys()));
    }

  } catch (error) {
    console.error(`❌ Error sending notification:`, error);
  }
};
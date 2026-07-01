"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSingleNotification = exports.sendPushNotification = void 0;
const accounts_model_1 = require("../modules/accounts/accounts.model");
const notification_model_1 = require("../modules/notification/notification.model");
const socket_1 = require("../socket");
const app_1 = require("firebase-admin/app");
const messaging_1 = require("firebase-admin/messaging");
// ✅ Initialize Firebase Admin only once
if (!(0, app_1.getApps)().length) {
    try {
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: (_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n'),
        };
        (0, app_1.initializeApp)({
            credential: (0, app_1.cert)(serviceAccount),
        });
        console.log('✅ Firebase Admin initialized successfully');
    }
    catch (error) {
        console.error('❌ Firebase Admin initialization failed:', error);
    }
}
// ✅ Get messaging instance
const messaging = (0, messaging_1.getMessaging)();
// Function to send notification to a specific device
const sendPushNotification = (fcmToken, title, message, data) => __awaiter(void 0, void 0, void 0, function* () {
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
        const response = yield messaging.send(payload);
        console.log('✅ Successfully sent notification:', response);
        return response;
    }
    catch (error) {
        console.error('❌ Error sending notification:', error);
        // Handle specific FCM errors
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
            console.log('⚠️ Invalid FCM token, removing from database');
            yield accounts_model_1.Accounts.findOneAndUpdate({ pushToken: fcmToken }, { $unset: { pushToken: "" } });
        }
        throw error;
    }
});
exports.sendPushNotification = sendPushNotification;
// Send a single-user notification
const sendSingleNotification = (userId, title, message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield accounts_model_1.Accounts.findById(userId).select("pushToken");
        if (!user) {
            console.log(`❌ User not found: ${userId}`);
            return;
        }
        const token = user.pushToken;
        console.log(`📱 Push Token: ${token}`);
        // Save notification to DB
        yield notification_model_1.Notification.create({
            to: [userId],
            title,
            message,
            deliveryStatus: "pending",
        });
        // Send push notification (if token exists)
        if (token) {
            try {
                yield (0, exports.sendPushNotification)(token, title, message, { userId: userId.toString() });
                console.log(`✅ Push notification sent to: ${userId}`);
            }
            catch (pushError) {
                console.error(`❌ Push notification failed:`, pushError);
            }
        }
        // ✅ Emit via Socket.io - Real-time notification
        const socketId = socket_1.userSocketMap.get(userId.toString());
        if (socketId && socket_1.io) {
            socket_1.io.to(socketId).emit("new-notification", {
                title,
                message,
                createdAt: new Date().toISOString(),
                userId: userId.toString(),
            });
            console.log(`✅ Socket notification sent to: ${userId} (Socket ID: ${socketId})`);
        }
        else {
            console.log(`⚠️ Socket not found for user: ${userId}`);
            console.log(`📊 Available sockets:`, Array.from(socket_1.userSocketMap.keys()));
        }
    }
    catch (error) {
        console.error(`❌ Error sending notification:`, error);
    }
});
exports.sendSingleNotification = sendSingleNotification;

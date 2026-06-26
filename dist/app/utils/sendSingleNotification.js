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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSingleNotification = void 0;
const expo_server_sdk_1 = __importDefault(require("expo-server-sdk"));
const accounts_model_1 = require("../modules/accounts/accounts.model");
const notification_model_1 = require("../modules/notification/notification.model");
const socket_1 = require("../socket");
const expo = new expo_server_sdk_1.default();
// Send a single-user Expo notification
const sendSingleNotification = (userId, title, message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield accounts_model_1.Accounts.findById(userId).select("expoPushToken");
        if (!user) {
            console.log(`❌ User not found: ${userId}`);
            return;
        }
        const token = user.expoPushToken;
        console.log(`📱 Expo Push Token: ${token}`);
        // Save notification to DB
        yield notification_model_1.Notification.create({
            to: [userId],
            title,
            message,
            deliveryStatus: "pending",
        });
        // Send Expo push notification (if token exists)
        if (token && expo_server_sdk_1.default.isExpoPushToken(token)) {
            try {
                yield expo.sendPushNotificationsAsync([
                    {
                        to: token,
                        sound: "default",
                        title,
                        body: message,
                    },
                ]);
                console.log(`✅ Expo push sent to: ${userId}`);
            }
            catch (pushError) {
                console.error(`❌ Expo push failed:`, pushError);
            }
        }
        // ✅ Emit via Socket.io - Get the socket ID from userSocketMap
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

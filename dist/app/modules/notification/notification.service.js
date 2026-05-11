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
exports.NotificationService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/modules/notification/notification.service.ts
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const notification_model_1 = require("./notification.model");
const expo_server_sdk_1 = __importDefault(require("expo-server-sdk"));
const server_1 = require("../../../server");
const accounts_model_1 = require("../accounts/accounts.model");
const expo = new expo_server_sdk_1.default();
const sendNotification = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { userIds, title, message } = payload;
    const users = yield accounts_model_1.Accounts.find({ _id: { $in: userIds } }).select("_id expoPushToken");
    if (!users || users.length === 0) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "No users found for provided ids");
    }
    const createdNotification = yield notification_model_1.Notification.create({
        to: users.map((u) => u._id),
        title,
        message,
        deliveryStatus: "pending",
    });
    // Expo push (unchanged)
    const messages = [];
    for (const user of users) {
        if (!user.expoPushToken || !expo_server_sdk_1.default.isExpoPushToken(user.expoPushToken)) {
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
            const ticketChunk = yield expo.sendPushNotificationsAsync(chunk);
            for (const ticket of ticketChunk) {
                if (ticket.status === "ok")
                    successCount++;
                else
                    failCount++;
            }
        }
        catch (error) {
            console.error("Error sending Expo chunk:", error);
            failCount += chunk.length;
        }
    }
    const overallStatus = successCount === 0 ? "failed" : failCount > 0 ? "partial" : "sent";
    yield notification_model_1.Notification.updateOne({ _id: createdNotification._id }, { $set: { deliveryStatus: overallStatus } });
    // 🔥 REAL-TIME SOCKET EMIT (THIS WAS MISSING)
    users.forEach((user) => {
        server_1.io.to(user._id.toString()).emit("new-notification", {
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
});
const getMyNotifications = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return notification_model_1.Notification.find({ to: userId }).sort({ createdAt: -1 });
});
const markAsRead = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return notification_model_1.Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
});
exports.NotificationService = {
    sendNotification,
    getMyNotifications,
    markAsRead,
};

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
const server_1 = require("../../server");
const accounts_model_1 = require("../modules/accounts/accounts.model");
const notification_model_1 = require("../modules/notification/notification.model");
const expo = new expo_server_sdk_1.default();
console.log(expo);
//Send a single-user Expo notification
const sendSingleNotification = (userId, title, message) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield accounts_model_1.Accounts.findById(userId).select("expoPushToken");
    if (!user)
        return;
    const token = user.expoPushToken;
    console.log(token);
    // if (!Expo.isExpoPushToken(token)) return;
    // Save notification to DB
    yield notification_model_1.Notification.create({
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
    server_1.io.to(userId.toString()).emit("new-notification", {
        title,
        message,
        createdAt: Date.now(),
    });
});
exports.sendSingleNotification = sendSingleNotification;

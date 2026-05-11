"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const NotificationSchema = new mongoose_1.Schema({
    to: { type: [mongoose_1.Schema.Types.ObjectId], ref: "User", required: true },
    title: String,
    message: String,
    isRead: { type: Boolean, default: false },
    data: Object,
    deliveryStatus: {
        type: String,
        enum: ["pending", "sent", "partial", "failed"],
        default: "pending",
    },
}, { timestamps: true });
exports.Notification = (0, mongoose_1.model)("Notification", NotificationSchema);

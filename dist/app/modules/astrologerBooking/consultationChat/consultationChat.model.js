"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ConsultationChatSchema = new mongoose_1.Schema({
    consultationId: {
        type: mongoose_1.Types.ObjectId,
        ref: "Consultation",
        required: true,
        index: true,
    },
    sender: {
        type: mongoose_1.Types.ObjectId,
        ref: "Accounts",
        required: true,
    },
    receiver: {
        type: mongoose_1.Types.ObjectId,
        ref: "Accounts",
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent",
    },
    readAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Indexes
ConsultationChatSchema.index({ consultationId: 1, createdAt: -1 });
ConsultationChatSchema.index({ sender: 1, receiver: 1 });
ConsultationChatSchema.index({ consultationId: 1, isRead: 1 });
const ConsultationChat = (0, mongoose_1.model)("ConsultationChat", ConsultationChatSchema);
exports.default = ConsultationChat;

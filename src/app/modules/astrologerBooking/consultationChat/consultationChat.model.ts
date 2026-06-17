import { Schema, Types, model } from "mongoose";
import { TConsultationChat } from "./consultationChat.interface";

const ConsultationChatSchema = new Schema<TConsultationChat>(
    {
        consultationId: {
            type: Types.ObjectId,
            ref: "Consultation",
            required: true,
            index: true,
        },
        sender: {
            type: Types.ObjectId,
            ref: "Accounts",
            required: true,
        },
        receiver: {
            type: Types.ObjectId,
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
    },
    {
        timestamps: true,
    }
);

// Indexes
ConsultationChatSchema.index({ consultationId: 1, createdAt: -1 });
ConsultationChatSchema.index({ sender: 1, receiver: 1 });
ConsultationChatSchema.index({ consultationId: 1, isRead: 1 });

const ConsultationChat = model<TConsultationChat>("ConsultationChat", ConsultationChatSchema);

export default ConsultationChat;
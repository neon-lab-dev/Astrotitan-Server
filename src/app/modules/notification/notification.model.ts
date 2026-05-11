import { Schema, model } from "mongoose";
import { TNotification } from "./notification.interface";

const NotificationSchema = new Schema<TNotification>(
  {
    to: { type: [Schema.Types.ObjectId], ref: "User", required: true },
    title: String,
    message: String,
    isRead: { type: Boolean, default: false },
    data: Object,
    deliveryStatus: {
      type: String,
      enum: ["pending", "sent", "partial", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Notification = model<TNotification>("Notification", NotificationSchema);
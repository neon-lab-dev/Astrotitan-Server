/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectId } from "mongoose";

export type TNotification = {
  to: ObjectId[];
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, any>;
  deliveryStatus?: string;
}
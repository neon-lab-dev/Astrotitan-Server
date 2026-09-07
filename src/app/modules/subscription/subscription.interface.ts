import { ObjectId } from "mongoose";

export type TSubscription = {
  user: ObjectId;
  subscriptionPlanId : ObjectId;
  startDate: Date;
  endDate: Date;
  status: "active" | "expired" | "pending" | "cancelled";
  cancelDate?: Date;
  cancelReason?: string;
  razorpaySubscriptionId: string;
};
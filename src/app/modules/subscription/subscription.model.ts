import { Schema, model } from "mongoose";
import { TSubscription } from "./subscription.interface";

const subscriptionSchema = new Schema<TSubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "Accounts",
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "pending", "cancelled"],
      default: "pending",
      index: true,
    },
    cancelDate: {
      type: Date,
    },
    cancelReason: {
      type: String,
      trim: true,
    },
    razorpaySubscriptionId: {
      type: String,
      required: true,
      index: true,
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ status: 1, endDate: 1 });
subscriptionSchema.index({ endDate: 1 }); // For expired subscriptions cleanup

// Virtual: Check if subscription is active
subscriptionSchema.virtual("isActive").get(function () {
  return this.status === "active" && new Date() < this.endDate;
});

// Virtual: Get remaining days
subscriptionSchema.virtual("remainingDays").get(function () {
  if (this.status !== "active") return 0;
  const now = new Date();
  const diffTime = this.endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Ensure virtuals are included in JSON output
subscriptionSchema.set("toJSON", { virtuals: true });
subscriptionSchema.set("toObject", { virtuals: true });

const Subscription = model<TSubscription>("Subscription", subscriptionSchema);

export default Subscription;
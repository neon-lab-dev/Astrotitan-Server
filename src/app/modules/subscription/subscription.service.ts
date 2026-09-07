/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { razorpay } from "../../utils/razorpay";
import config from "../../config";
import Subscription from "./subscription.model";
import { User } from "../users/user.model";
import { infinitePaginate } from "../../utils/infinitePaginate";
import { Accounts } from "../accounts/accounts.model";
import { sendSingleNotification } from "../../utils/sendSingleNotification";
import SubscriptionPlan from "../subscriptionPlan/subscriptionPlan.model";


const createRazorpayOrder = async (payload: any) => {
  const { amount } = payload;

  const order = await razorpay.orders.create({
    amount: amount * 100, // Convert to paise
    currency: "INR",
    receipt: `order_${Date.now()}`,
  });

  return order;
};


/* Create Subscription */
const createSubscription = async (accountId: string, payload: any) => {
  const subscriptionPlan = await SubscriptionPlan.findById(payload.subscriptionPlanId);
  if (!subscriptionPlan) {
    throw new AppError(httpStatus.NOT_FOUND, "Subscription plan not found");
  }

  if (subscriptionPlan.isActive === false) {
    throw new AppError(httpStatus.BAD_REQUEST, "Subscription plan is not active");
  };

  // Find user using accountId
  const user = await User.findOne({ accountId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const planId = config.subscription_plan_id;
  if (!planId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Razorpay planId not configured"
    );
  }

  // Check if user already has an active subscription
  const existingSubscription = await Subscription.findOne({
    user: user._id,
    status: { $in: ["active", "pending"] },
  });

  if (existingSubscription) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User already has an active or pending subscription"
    );
  }

  let razorpaySubscription;
  try {
    razorpaySubscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 1,
      quantity: 1,
    });
  } catch (error: any) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to create subscription"
    );
  }

  // Convert timestamps safely
  const startDate = razorpaySubscription.start_at
    ? new Date(razorpaySubscription.start_at * 1000)
    : new Date();

  let endDate = razorpaySubscription.end_at
    ? new Date(razorpaySubscription.end_at * 1000)
    : null;

  // Calculate end date if not provided (1 month from start)
  if (!endDate) {
    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
  }

  const payloadData = {
    user: user._id,
    subscriptionPlanId: subscriptionPlan._id,
    razorpaySubscriptionId: razorpaySubscription.id,
    status: "active",
    startDate,
    endDate,
  };

  const subscription = await Subscription.create(payloadData);

  await User.updateOne({ _id: user?._id }, { $set: { isPremiumUser: true } });

  const admin = await Accounts.findOne({ role: "admin" });
  if (!admin) {
    throw new AppError(httpStatus.NOT_FOUND, "Admin not found");
  }


  await sendSingleNotification(
    admin._id as any,
    "Subscription Purchased",
    `${user?.firstName} ${user?.lastName} has purchased subscription of ${subscriptionPlan.name}.`
  );

  return subscription;
};

/* Verify Subscription */
const verifySubscription = async (razorpayPaymentId: string) => {
  return `${process.env.PAYMENT_REDIRECT_URL}-success?type=subscription&orderId=${razorpayPaymentId}`;
};

/* Get All Subscriptions (Admin) */
const getAllSubscriptions = async (
  filters: {
    keyword?: string;
    status?: string;
    isAddedToWhatsappGroup?: string;
    isSuspended?: string;
    isRemoved?: string;
  } = {},
  skip = 0,
  limit = 10
) => {
  const query: any = {};

  // Keyword search
  if (filters.keyword) {
    query.$or = [
      { user: { $regex: filters.keyword, $options: "i" } },
      { razorpaySubscriptionId: { $regex: filters.keyword, $options: "i" } },
    ];
  }

  // Status filter
  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }

  // Boolean filters
  if (filters.isAddedToWhatsappGroup !== undefined) {
    query.isAddedToWhatsappGroup = filters.isAddedToWhatsappGroup === "true";
  }

  if (filters.isSuspended !== undefined) {
    query.isSuspended = filters.isSuspended === "true";
  }

  if (filters.isRemoved !== undefined) {
    query.isRemoved = filters.isRemoved === "true";
  }

  // Use infinitePaginate
  const result = await infinitePaginate(
    Subscription,
    query,
    skip,
    limit,
    ["user", "subscriptionPlanId"]
  );

  return result;
};

/* Get Single Subscription By ID (Admin) */
const getSingleSubscriptionById = async (subscriptionId: string) => {
  const subscription = await Subscription.findById(subscriptionId).populate(
    "user subscriptionPlanId",
    "firstName lastName email profilePicture"
  );

  if (!subscription) {
    throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");
  }
  return subscription;
};

/* Get My Subscription (User) */
const getMySubscription = async (accountId: string) => {
  // Find user using accountId
  const user = await User.findOne({ accountId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const subscription = await Subscription.findOne({
    user: user._id, // Use User ObjectId
  }).sort({ createdAt: -1 }).populate("subscriptionPlanId");

  return subscription;
};

/* Cancel Subscription */
const cancelSubscription = async (
  accountId: string,
  payload: {
    cancelReason?: string;
  }
) => {
  // Find user using accountId
  const user = await User.findOne({ accountId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const subscription = await Subscription.findOne({
    user: user._id, // Use User ObjectId
    status: { $in: ["active", "pending"] },
  });

  if (!subscription) {
    throw new AppError(httpStatus.NOT_FOUND, "No active subscription found to cancel");
  }

  if (subscription.status === "cancelled") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Subscription is already cancelled!"
    );
  }

  subscription.status = "cancelled";
  subscription.cancelDate = new Date();
  if (payload.cancelReason) {
    subscription.cancelReason = payload.cancelReason;
  }

  await User.updateOne({ accountId: accountId }, { $set: { isPremiumUser: false } });

  await subscription.save();

  // Send cancellation email
  // await sendSubscriptionStatusEmails(user, subscription, "cancelled");

  return subscription;
};

export const SubscriptionServices = {
  createRazorpayOrder,
  createSubscription,
  verifySubscription,
  getAllSubscriptions,
  getSingleSubscriptionById,
  getMySubscription,
  cancelSubscription,
};
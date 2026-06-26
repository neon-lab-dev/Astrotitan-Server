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
exports.SubscriptionServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const razorpay_1 = require("../../utils/razorpay");
const config_1 = __importDefault(require("../../config"));
const subscription_model_1 = __importDefault(require("./subscription.model"));
const user_model_1 = require("../users/user.model");
const infinitePaginate_1 = require("../../utils/infinitePaginate");
const createRazorpayOrder = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { amount } = payload;
    const order = yield razorpay_1.razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency: "INR",
        receipt: `order_${Date.now()}`,
    });
    return order;
});
/* Create Subscription */
const createSubscription = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    // Find user using accountId
    const user = yield user_model_1.User.findOne({ accountId });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const planId = config_1.default.subscription_plan_id;
    if (!planId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Razorpay planId not configured");
    }
    // Check if user already has an active subscription
    const existingSubscription = yield subscription_model_1.default.findOne({
        user: user._id,
        status: { $in: ["active", "pending"] },
    });
    if (existingSubscription) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "User already has an active or pending subscription");
    }
    let razorpaySubscription;
    try {
        razorpaySubscription = yield razorpay_1.razorpay.subscriptions.create({
            plan_id: planId,
            customer_notify: 1,
            total_count: 1,
            quantity: 1,
        });
    }
    catch (error) {
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to create subscription");
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
    const payload = {
        user: user._id,
        razorpaySubscriptionId: razorpaySubscription.id,
        status: "active",
        startDate,
        endDate,
    };
    const subscription = yield subscription_model_1.default.create(payload);
    yield user_model_1.User.updateOne({ _id: user === null || user === void 0 ? void 0 : user._id }, { $set: { isPremiumUser: true } });
    // Send subscription created email (optional)
    // await sendSubscriptionEmails(user, subscription);
    return subscription;
});
/* Verify Subscription */
const verifySubscription = (razorpayPaymentId) => __awaiter(void 0, void 0, void 0, function* () {
    return `${process.env.PAYMENT_REDIRECT_URL}-success?type=subscription&orderId=${razorpayPaymentId}`;
});
/* Get All Subscriptions (Admin) */
const getAllSubscriptions = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
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
    const result = yield (0, infinitePaginate_1.infinitePaginate)(subscription_model_1.default, query, skip, limit, ["user"] // Populate user field
    );
    return result;
});
/* Get Single Subscription By ID (Admin) */
const getSingleSubscriptionById = (subscriptionId) => __awaiter(void 0, void 0, void 0, function* () {
    const subscription = yield subscription_model_1.default.findById(subscriptionId).populate("user", "firstName lastName email profilePicture");
    if (!subscription) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Subscription not found");
    }
    return subscription;
});
/* Get My Subscription (User) */
const getMySubscription = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    // Find user using accountId
    const user = yield user_model_1.User.findOne({ accountId });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const subscription = yield subscription_model_1.default.findOne({
        user: user._id, // Use User ObjectId
    }).sort({ createdAt: -1 });
    return subscription;
});
/* Cancel Subscription */
const cancelSubscription = (accountId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Find user using accountId
    const user = yield user_model_1.User.findOne({ accountId });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const subscription = yield subscription_model_1.default.findOne({
        user: user._id, // Use User ObjectId
        status: { $in: ["active", "pending"] },
    });
    if (!subscription) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "No active subscription found to cancel");
    }
    if (subscription.status === "cancelled") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Subscription is already cancelled!");
    }
    subscription.status = "cancelled";
    subscription.cancelDate = new Date();
    if (payload.cancelReason) {
        subscription.cancelReason = payload.cancelReason;
    }
    yield subscription.save();
    // Send cancellation email
    // await sendSubscriptionStatusEmails(user, subscription, "cancelled");
    return subscription;
});
exports.SubscriptionServices = {
    createRazorpayOrder,
    createSubscription,
    verifySubscription,
    getAllSubscriptions,
    getSingleSubscriptionById,
    getMySubscription,
    cancelSubscription,
};

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
exports.BoardRoomBanterSubscriptionController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const subscription_service_1 = require("./subscription.service");
const createRazorpayOrder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield subscription_service_1.SubscriptionServices.createRazorpayOrder(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Order created.",
        data: result,
    });
}));
const createSubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const result = yield subscription_service_1.SubscriptionServices.createSubscription(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Congratulations! Now you are a Premium Member of Astrotitan!",
        data: result,
    });
}));
const verifySubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { razorpay_payment_id } = req.body;
    const redirectUrl = yield subscription_service_1.SubscriptionServices.verifySubscription(razorpay_payment_id);
    return res.redirect(redirectUrl);
}));
// Get all subscriptions (Admin/Moderator)
const getAllSubscriptions = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { keyword, status, isAddedToWhatsappGroup, isSuspended, isRemoved, skip = "0", limit = "10", } = req.query;
    const filters = {
        keyword: keyword,
        status: status,
        isAddedToWhatsappGroup: isAddedToWhatsappGroup,
        isSuspended: isSuspended,
        isRemoved: isRemoved,
    };
    const result = yield subscription_service_1.SubscriptionServices.getAllSubscriptions(filters, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Subscriptions fetched successfully",
        data: result,
    });
}));
// Get single subscription by ID
const getSingleSubscriptionById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield subscription_service_1.SubscriptionServices.getSingleSubscriptionById(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Subscription fetched successfully",
        data: result,
    });
}));
const cancelSubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const result = yield subscription_service_1.SubscriptionServices.cancelSubscription(userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Subscription cancelled!",
        data: result,
    });
}));
const getMySubscription = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const result = yield subscription_service_1.SubscriptionServices.getMySubscription(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Fetched my subscription successfully",
        data: result,
    });
}));
exports.BoardRoomBanterSubscriptionController = {
    createRazorpayOrder,
    createSubscription,
    verifySubscription,
    getAllSubscriptions,
    getSingleSubscriptionById,
    cancelSubscription,
    getMySubscription,
};

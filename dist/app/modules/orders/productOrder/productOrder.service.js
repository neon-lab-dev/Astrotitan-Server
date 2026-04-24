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
exports.ProductOrderService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const productOrder_model_1 = require("./productOrder.model");
const razorpay_1 = require("../../../utils/razorpay");
const product_model_1 = __importDefault(require("../../product/product.model"));
const checkout = (amount) => __awaiter(void 0, void 0, void 0, function* () {
    if (!amount || amount <= 0) {
        throw new Error("Invalid payment amount");
    }
    const razorpayOrder = yield razorpay_1.razorpay.orders.create({
        amount: amount * 100, //in paisa
        currency: "INR",
    });
    return razorpayOrder;
});
// Verify payment
const verifyPayment = (razorpayPaymentId) => __awaiter(void 0, void 0, void 0, function* () {
    return `${process.env.PAYMENT_REDIRECT_URL}-success?type=product&orderId=${razorpayPaymentId}`;
});
// Create Razorpay order
const createProductOrder = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const productIds = payload.orderedItems.map((i) => i.productId);
    const products = yield product_model_1.default.find({ _id: { $in: productIds } });
    if (products.length !== payload.orderedItems.length) {
        throw new Error("Some products not found");
    }
    for (const item of payload.orderedItems) {
        const product = products.find((p) => p._id.toString() === item.productId.toString());
        if (!product) {
            throw new Error(`Product ${item.productId} not found`);
        }
        //Check quantity availability
        if (product.quantity < item.quantity) {
            throw new Error(`Not enough stock for product ${product.name}. Available: ${product.quantity}`);
        }
        //Save updated product
        yield product.save();
    }
    const orderedItems = payload === null || payload === void 0 ? void 0 : payload.orderedItems;
    const payloadData = {
        userId: user === null || user === void 0 ? void 0 : user._id,
        orderedItems,
        totalAmount: payload.totalAmount,
        status: "pending",
    };
    const order = yield productOrder_model_1.ProductOrder.create(payloadData);
    return order;
});
// Get all orders
const getAllProductOrders = (keyword_1, status_1, ...args_1) => __awaiter(void 0, [keyword_1, status_1, ...args_1], void 0, function* (keyword, status, page = 1, limit = 10) {
    const query = {};
    // Status filter
    if (status && status !== "all") {
        query.status = { $regex: status, $options: "i" };
    }
    // Pagination
    const skip = (page - 1) * limit;
    // Base query
    let mongooseQuery = productOrder_model_1.ProductOrder.find(query)
        .populate("userId", "name email phoneNumber pinCode city addressLine1 addressLine2")
        .skip(skip)
        .limit(limit);
    // Apply keyword search (orderId + user fields)
    if (keyword) {
        mongooseQuery = mongooseQuery.find({
            $or: [
                { orderId: { $regex: keyword, $options: "i" } },
                { "userId.name": { $regex: keyword, $options: "i" } },
                { "userId.email": { $regex: keyword, $options: "i" } },
                { "userId.phoneNumber": { $regex: keyword, $options: "i" } },
            ],
        });
    }
    const [orders, total] = yield Promise.all([
        mongooseQuery.sort({ createdAt: -1 }),
        productOrder_model_1.ProductOrder.countDocuments(query),
    ]);
    return {
        meta: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
        data: orders,
    };
});
// Get single order by ID
const getSingleProductOrderById = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield productOrder_model_1.ProductOrder.findOne({ orderId })
        .populate("userId", "name email phoneNumber pinCode city addressLine1 addressLine2")
        .populate("orderedItems.productId", "name imageUrls category");
    if (!result) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Order not found");
    }
    return result;
});
// Get all orders for a particular user
const getProductOrdersByUserId = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield productOrder_model_1.ProductOrder.find({ userId });
    if (!result || result.length === 0) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "No orders found for this user");
    }
    return result;
});
// Get my orders
const getMyProductOrders = (userId_1, keyword_1, status_1, ...args_1) => __awaiter(void 0, [userId_1, keyword_1, status_1, ...args_1], void 0, function* (userId, keyword, status, page = 1, limit = 10) {
    const query = { userId };
    if (keyword) {
        query.$or = [{ orderId: { $regex: keyword, $options: "i" } }];
    }
    if (status && status !== "all") {
        query.status = { $regex: status, $options: "i" };
    }
    const skip = (page - 1) * limit;
    const [orders, total] = yield Promise.all([
        productOrder_model_1.ProductOrder.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate("userId", "name phoneNumber city pinCode addressLine1 addressLine2")
            .populate("orderedItems.productId", "name"),
        productOrder_model_1.ProductOrder.countDocuments(query),
    ]);
    return {
        meta: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
        data: orders,
    };
});
// Get my orders (user)
const updateDeliveryStatus = (orderId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield productOrder_model_1.ProductOrder.findByIdAndUpdate(orderId, { status: payload.status }, { new: true });
    return result;
});
exports.ProductOrderService = {
    checkout,
    verifyPayment,
    createProductOrder,
    getAllProductOrders,
    getSingleProductOrderById,
    getProductOrdersByUserId,
    getMyProductOrders,
    updateDeliveryStatus,
};

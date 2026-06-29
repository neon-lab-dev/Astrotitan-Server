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
const infinitePaginate_1 = require("../../../utils/infinitePaginate");
const config_1 = __importDefault(require("../../../config"));
const crypto_1 = __importDefault(require("crypto"));
const checkout = (amount) => __awaiter(void 0, void 0, void 0, function* () {
    if (!amount || amount <= 0) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid payment amount");
    }
    const razorpayOrder = yield razorpay_1.razorpay.orders.create({
        amount: amount * 100, // in paisa
        currency: "INR",
    });
    return {
        razorpayOrder,
        key_id: config_1.default.razorpay_api_key,
    };
});
// Verify payment (works for both web and app)
const verifyPayment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = payload;
    // Generate signature for verification
    const generatedSignature = crypto_1.default
        .createHmac("sha256", config_1.default.razorpay_api_secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");
    // Compare signatures
    if (generatedSignature !== razorpaySignature) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Payment verification failed: Invalid signature");
    }
    // Find order by razorpayOrderId or orderId
    let order;
    if (orderId) {
        order = yield productOrder_model_1.ProductOrder.findById(orderId);
    }
    else {
        order = yield productOrder_model_1.ProductOrder.findOne({ razorpayOrderId });
    }
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Order not found");
    }
    // Update order status
    order.paymentStatus = "paid";
    order.status = "confirmed";
    order.razorpayPaymentId = razorpayPaymentId;
    order.paymentDate = new Date();
    yield order.save();
    // Update product quantities (deduct stock)
    for (const item of order.orderedItems) {
        const product = yield product_model_1.default.findById(item.productId);
        if (product) {
            product.quantity -= item.quantity;
            yield product.save();
        }
    }
    // Return redirect URL for web (if needed)
    const redirectUrl = `${process.env.PAYMENT_REDIRECT_URL}-success?type=product&orderId=${order._id}`;
    return {
        success: true,
        message: "Payment verified successfully",
        order,
        redirectUrl,
    };
});
// Create Product Order (with Razorpay order for app)
const createProductOrder = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate products and stock
    const productIds = payload.orderedItems.map((i) => i.productId);
    const products = yield product_model_1.default.find({ _id: { $in: productIds } });
    if (products.length !== payload.orderedItems.length) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Some products not found");
    }
    // Get product details and validate stock
    const orderedItems = yield Promise.all(payload.orderedItems.map((item) => __awaiter(void 0, void 0, void 0, function* () {
        const product = products.find((p) => p._id.toString() === item.productId.toString());
        if (!product) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, `Product ${item.productId} not found`);
        }
        if (product.quantity < item.quantity) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Not enough stock for product ${product.name}. Available: ${product.quantity}`);
        }
        return {
            productId: product._id,
            name: product.name,
            quantity: item.quantity,
            price: product.basePrice,
        };
    })));
    // Create order ID
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const orderId = `AT-${randomNum}`;
    // Create Razorpay order
    const razorpayOrder = yield razorpay_1.razorpay.orders.create({
        amount: payload.totalAmount * 100, // Convert to paisa
        currency: "INR",
        receipt: orderId,
        notes: {
            orderId: orderId,
            userId: user._id.toString(),
        },
    });
    // Create order in database
    const order = yield productOrder_model_1.ProductOrder.create({
        orderId,
        userId: user._id,
        orderedItems,
        totalAmount: payload.totalAmount,
        addressId: payload.addressId,
        status: "pending",
        paymentStatus: "pending",
        razorpayOrderId: razorpayOrder.id,
    });
    // Return both: Razorpay order (for app) and redirect URL (for web)
    return {
        order,
        razorpayOrder: {
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key_id: config_1.default.razorpay_api_key,
        },
        paymentUrl: `${process.env.PAYMENT_REDIRECT_URL}?type=product&orderId=${order._id}&razorpayOrderId=${razorpayOrder.id}`,
    };
});
// Check payment status
const checkPaymentStatus = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield productOrder_model_1.ProductOrder.findById(orderId);
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Order not found");
    }
    return {
        orderId: order._id,
        orderNumber: order.orderId,
        paymentStatus: order.paymentStatus,
        status: order.status,
        totalAmount: order.totalAmount,
    };
});
// Get all orders
const getAllProductOrders = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
    // Status filter
    if (filters.status && filters.status !== "all") {
        query.status = { $regex: `^${filters.status}$`, $options: "i" };
    }
    // Keyword search (orderId)
    if (filters.keyword) {
        query.orderId = { $regex: filters.keyword, $options: "i" };
    }
    // Get paginated results with populate
    const result = yield (0, infinitePaginate_1.infinitePaginate)(productOrder_model_1.ProductOrder, query, skip, limit, ["userId"]);
    return result;
});
// Get single order by ID
const getSingleProductOrderById = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield productOrder_model_1.ProductOrder.findById(orderId)
        .populate("userId")
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
            .populate("userId")
            .populate("orderedItems.productId", "imageUrls"),
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
    checkPaymentStatus,
    getAllProductOrders,
    getSingleProductOrderById,
    getProductOrdersByUserId,
    getMyProductOrders,
    updateDeliveryStatus,
};

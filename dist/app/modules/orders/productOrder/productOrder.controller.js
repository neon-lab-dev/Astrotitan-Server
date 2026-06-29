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
exports.ProductOrderControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const productOrder_service_1 = require("./productOrder.service");
const checkout = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { amount } = req.body;
    const result = yield productOrder_service_1.ProductOrderService.checkout(amount);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Checkout initiated successfully",
        data: result,
    });
}));
// ✅ Verify Payment (works for both web and app)
const verifyPayment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId // Optional - for web
     } = req.body;
    const result = yield productOrder_service_1.ProductOrderService.verifyPayment({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        orderId,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Payment verified successfully",
        data: result,
    });
}));
// ✅ Create Product Order (with Razorpay order for app)
const createProductOrder = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield productOrder_service_1.ProductOrderService.createProductOrder(user, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Order created successfully",
        data: result,
    });
}));
// ✅ Check payment status
const checkPaymentStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    const result = yield productOrder_service_1.ProductOrderService.checkPaymentStatus(orderId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Payment status fetched successfully",
        data: result,
    });
}));
// Get all orders (Admin/Moderator)
const getAllProductOrders = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { keyword, status, skip = "0", limit = "10", } = req.query;
    const filters = {
        keyword: keyword,
        status: status,
    };
    const result = yield productOrder_service_1.ProductOrderService.getAllProductOrders(filters, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "All Orders fetched successfully",
        data: {
            productOrders: result.data,
            meta: result.meta,
        },
    });
}));
// Get single order by ID
const getSingleProductOrderById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    const result = yield productOrder_service_1.ProductOrderService.getSingleProductOrderById(orderId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Order fetched successfully",
        data: result,
    });
}));
// Get all orders for a particular user
const getProductOrdersByUserId = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const result = yield productOrder_service_1.ProductOrderService.getProductOrdersByUserId(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Orders fetched successfully",
        data: result,
    });
}));
// Get logged-in user's orders (user)
const getMyProductOrders = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { keyword, status, page = "1", limit = "10" } = req.query;
    const result = yield productOrder_service_1.ProductOrderService.getMyProductOrders(userId, keyword, status, Number(page), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "My orders fetched successfully",
        data: {
            orders: result.data,
            pagination: result.meta,
        },
    });
}));
// Update delivery status (Admin/Moderator)
const updateDeliveryStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    const result = yield productOrder_service_1.ProductOrderService.updateDeliveryStatus(orderId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Status changed successfully",
        data: result,
    });
}));
exports.ProductOrderControllers = {
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

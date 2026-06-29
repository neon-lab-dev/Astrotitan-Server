"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductOrder = void 0;
const mongoose_1 = require("mongoose");
const OrderItemSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
});
const ProductOrderSchema = new mongoose_1.Schema({
    orderId: { type: String, required: true, unique: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    addressId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Address", required: true },
    orderedItems: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ["pending", "confirmed", "shipped", "cancelled"],
        default: "pending",
    },
    // Payment fields
    razorpayOrderId: {
        type: String,
        index: true,
    },
    razorpayPaymentId: {
        type: String,
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
    },
    paymentDate: {
        type: Date,
    },
}, { timestamps: true });
exports.ProductOrder = (0, mongoose_1.model)("ProductOrder", ProductOrderSchema);

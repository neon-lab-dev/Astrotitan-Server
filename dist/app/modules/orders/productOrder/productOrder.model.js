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
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    orderedItems: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ["pending", "shipped", "cancelled"],
        default: "pending",
    },
}, { timestamps: true });
exports.ProductOrder = (0, mongoose_1.model)("ProductOrder", ProductOrderSchema);

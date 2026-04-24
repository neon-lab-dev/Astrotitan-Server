import { Schema, model } from "mongoose";
import { TProductOrder, TProductOrderItem } from "./productOrder.interface";

const OrderItemSchema = new Schema<TProductOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const ProductOrderSchema = new Schema<TProductOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    orderedItems: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "shipped", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const ProductOrder = model<TProductOrder>("ProductOrder", ProductOrderSchema);
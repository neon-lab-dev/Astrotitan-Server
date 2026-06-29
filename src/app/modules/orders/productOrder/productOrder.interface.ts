import { ObjectId } from "mongoose";

export interface TProductOrderItem {
  productId: ObjectId;
  name: string
  quantity: number;
  price: number;
}

export interface TProductOrder {
  orderId: string;
  userId: ObjectId;
  addressId: ObjectId;
  orderedItems: TProductOrderItem[];
  totalAmount: number;
  status: "pending" | "confirmed" | "shipped" | "cancelled";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentStatus?: "pending" | "paid" | "failed";
  paymentDate?: Date;
}
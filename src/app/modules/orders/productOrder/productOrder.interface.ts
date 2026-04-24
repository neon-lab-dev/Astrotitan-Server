import { ObjectId } from "mongoose";

export interface TProductOrderItem {
  productId: ObjectId;
  name : string
  quantity: number;
  price: number;
}

export interface TProductOrder {
  userId: ObjectId;
  orderedItems: TProductOrderItem[];
  totalAmount: number;
  status: "pending" | "shipped" | "cancelled";
}
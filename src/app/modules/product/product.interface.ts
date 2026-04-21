import { ObjectId } from "mongoose";

export type TProduct = {
  name: string;
  category: string;
  description: string;
  imageUrls: string[];
  rating?: number;
  reviews?: {
    user: ObjectId;
    review: string;
    rating: number;
    images: string[];
  }[];
  basePrice: number;
  discountedPrice?: number;
  whyThisWork: string;
  targetAudience: string;
  howToUse: string;
  createdAt?: Date;
  updatedAt?: Date;
};
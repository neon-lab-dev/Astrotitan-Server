import { ObjectId } from "mongoose";

export type TPujaReview = {
  user: ObjectId;
  review: string;
  rating: number;
  images: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type TPuja = {
  name: string;
  category: string;
  description: string;
  imageUrls: string[];
  rating?: number;
  reviews: TPujaReview[];
  basePrice: number;
  discountedPrice?: number;
  targetAudience: string;
  howThisPujaPerformed: string;
  addedBy?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};
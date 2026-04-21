import { Schema, model } from "mongoose";
import { TProduct } from "./product.interface";

const productSchema = new Schema<TProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "Accounts",
          required: true,
        },
        review: {
          type: String,
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        images: {
          type: [String],
          default: [],
        },
      },
    ],
    basePrice: {
      type: Number,
      required: true,
    },
    discountedPrice: {
      type: Number,
      default: null,
    },
    whyThisWork: {
      type: String,
      required: true,
    },
    targetAudience: {
      type: String,
      required: true,
    },
    howToUse: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text search index
productSchema.index({
  name: "text",
  description: "text",
  category: "text",
  whyThisWork: "text",
});

// Compound indexes for filtering
productSchema.index({ category: 1, rating: -1 });
productSchema.index({ category: 1, basePrice: 1 });
productSchema.index({ rating: -1 });

const Product = model<TProduct>("Product", productSchema);

export default Product;
import { Schema, model } from "mongoose";
import { TPuja } from "./puja.interface";

const pujaReviewSchema = new Schema(
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
  {
    timestamps: true,
  }
);

const pujaSchema = new Schema<TPuja>(
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
    reviews: [pujaReviewSchema],
    basePrice: {
      type: Number,
      required: true,
    },
    discountedPrice: {
      type: Number,
      default: null,
    },
    targetAudience: {
      type: String,
      required: true,
    },
    howThisPujaPerformed: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text search index
pujaSchema.index({
  name: "text",
  description: "text",
  category: "text",
  targetAudience: "text",
  howThisPujaPerformed: "text",
});

// Compound indexes for filtering
pujaSchema.index({ category: 1, rating: -1 });
pujaSchema.index({ category: 1, basePrice: 1 });
pujaSchema.index({ rating: -1 });
pujaSchema.index({ addedBy: 1 });

const Puja = model<TPuja>("Puja", pujaSchema);

export default Puja;
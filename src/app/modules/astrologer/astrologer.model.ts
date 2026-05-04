// astrologer.model.ts
import { Schema, model } from "mongoose";
import { TAstrologer, AstrologerModel } from "./astrologer.interface";
import mongoose from "mongoose";

const astrologerSchema = new Schema<TAstrologer, AstrologerModel>(
  {
    accountId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      ref: "Accounts",
    },
    profilePicture: {
      type: String,
      required: false,
      trim: true,
    },
    firstName: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100,
      index: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100,
      index: true,
    },
    displayName: {
      type: String,
      required: false,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
      index: true,
    },
    gender: {
      type: String,
      required: false,
      enum: ["male", "female", "non-binary", "other"],
      index: true,
    },
    consultLanguages: {
      type: [String],
      required: false,
      default: [],
      index: true,
    },
    areaOfPractice: {
      type: [String],
      required: false,
      default: [],
      index: true,
    },
    experience: {
      type: String,
      required: false,
    },
    bio: {
      type: String,
      required: false,
      trim: true,
    },
    country: {
      type: String,
      required: false,
      trim: true,
      index: true,
    },
    identity: {
      identityType: {
        type: String,
        required: false,
        enum: ["aadharCard", "panCard"],
      },
      frontSide: {
        type: String,
        required: false,
        trim: true,
      },
      backSide: {
        type: String,
        required: false,
        trim: true,
      },
      status: {
        type: String,
        required: false,
        enum: ["pending", "approved", "rejected"],
      },
      rejectedReason: {
        type: String,
        required: false,
        trim: true,
      }
    },
    isIdentityVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isProfileCompleted: {
      type: Boolean,
      default: false,
      index: true,
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
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries (only if fields exist)
astrologerSchema.index({ firstName: 1, lastName: 1 });
astrologerSchema.index({ areaOfPractice: 1, country: 1 });
astrologerSchema.index({ consultLanguages: 1, isProfileCompleted: 1 });
astrologerSchema.index({ country: 1, isProfileCompleted: 1 });

// Text index for search functionality
astrologerSchema.index(
  {
    firstName: "text",
    lastName: "text",
    displayName: "text",
    bio: "text",
    areaOfPractice: "text",
  },
  {
    weights: {
      firstName: 10,
      lastName: 10,
      displayName: 8,
      areaOfPractice: 5,
      bio: 3,
    },
    name: "astrologer_search_index",
  }
);

export const Astrologer = mongoose.models.Astrologer ||
  model<TAstrologer, AstrologerModel>("Astrologer", astrologerSchema);
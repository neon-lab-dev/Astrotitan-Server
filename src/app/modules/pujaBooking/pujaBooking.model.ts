import { Schema, model } from "mongoose";
import { TPujaBooking } from "./pujaBooking.interface";

const pujaBookingSchema = new Schema<TPujaBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    pujaId: {
      type: Schema.Types.ObjectId,
      ref: "Puja",
      required: true,
      index: true,
    },
    preferredDate: {
      type: Date,
      required: true,
    },
    purposeOfPuja: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "contacted", "booked", "notInterested"],
      default: "pending",
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
pujaBookingSchema.index({ userId: 1, status: 1 });
pujaBookingSchema.index({ pujaId: 1, status: 1 });
pujaBookingSchema.index({ createdAt: -1 });
pujaBookingSchema.index({ preferredDate: 1 });

export const PujaBooking = model<TPujaBooking>("PujaBooking", pujaBookingSchema);
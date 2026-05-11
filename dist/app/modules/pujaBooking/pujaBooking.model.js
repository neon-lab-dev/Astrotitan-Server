"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PujaBooking = void 0;
const mongoose_1 = require("mongoose");
const pujaBookingSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
// Indexes
pujaBookingSchema.index({ userId: 1, status: 1 });
pujaBookingSchema.index({ pujaId: 1, status: 1 });
pujaBookingSchema.index({ createdAt: -1 });
pujaBookingSchema.index({ preferredDate: 1 });
exports.PujaBooking = (0, mongoose_1.model)("PujaBooking", pujaBookingSchema);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ConsultationSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    astrologer: {
        type: mongoose_1.Types.ObjectId,
        ref: "Astrologer",
        required: true,
        index: true,
    },
    method: {
        type: String,
        enum: ["chat", "call"],
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "declined", "ended"],
        default: "pending",
        index: true,
    },
    consultationFor: {
        type: String,
        trim: true,
        required: true,
    },
    acceptedAt: {
        type: Date,
    },
    declinedAt: {
        type: Date,
    },
    endedAt: {
        type: Date,
    },
    endedBy: {
        type: String,
        enum: ["user", "astrologer"],
    },
    startedAt: {
        type: Date,
    },
    duration: {
        type: Number, // in minutes
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    review: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});
// Indexes
ConsultationSchema.index({ user: 1, status: 1 });
ConsultationSchema.index({ astrologer: 1, status: 1 });
ConsultationSchema.index({ status: 1, createdAt: -1 });
ConsultationSchema.index({ user: 1, astrologer: 1 });
const Consultation = (0, mongoose_1.model)("Consultation", ConsultationSchema);
exports.default = Consultation;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const KundliRequestSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    astrologerId: {
        type: mongoose_1.Types.ObjectId,
        ref: "Astrologer",
        required: false,
        index: true,
    },
    requestType: {
        type: String,
        enum: ["generateKundli", "analyzeKundli"],
        required: true,
    },
    existingKundliFiles: {
        type: [String],
        required: false,
    },
    // User Snapshot
    userName: {
        type: String,
        required: true,
        trim: true,
    },
    userEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    userPhoneNumber: {
        type: String,
        required: true,
        trim: true,
    },
    // Birth Details
    dateOfBirth: {
        type: Date,
        required: true,
    },
    timeOfBirth: {
        type: String,
        required: true,
    },
    placeOfBirth: {
        type: String,
        required: true,
        trim: true,
    },
    userGender: {
        type: String,
        enum: ["male", "female", "other"],
        required: true,
    },
    // Kundli
    kundliType: {
        type: String,
        enum: ["birthChart",
            "compatibility",
            "career",
            "marriage",
            "yearly",
            "love",
            "health",
            "finance",
            "education",
            "business",
            "child",
            "foreignTravel",
            "property",
            "doshaAnalysis",
            "gemstone",],
        required: true,
    },
    userNotes: {
        type: String,
        required: false,
        trim: true,
    },
    // Status
    status: {
        type: String,
        enum: ["pending", "accepted", "completed", "cancelled"],
        default: "pending",
        index: true,
    },
    // Result
    reportUrl: {
        type: String,
        required: false,
        trim: true,
    },
}, {
    timestamps: true,
});
// Indexes for better query performance
KundliRequestSchema.index({ userId: 1, status: 1 });
KundliRequestSchema.index({ astrologerId: 1, status: 1 });
KundliRequestSchema.index({ status: 1, createdAt: -1 });
const KundliRequest = (0, mongoose_1.model)("KundliRequest", KundliRequestSchema);
exports.default = KundliRequest;

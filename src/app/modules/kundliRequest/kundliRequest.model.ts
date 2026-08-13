import { model, Schema, Types } from "mongoose";
import { TKundliRequest } from "./kundliRequest.interface";

const KundliRequestSchema = new Schema<TKundliRequest>(
    {
        userId: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        astrologerId: {
            type: Types.ObjectId,
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
        latitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
        timezone: {
            type: Number,
            required: true,
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
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
KundliRequestSchema.index({ userId: 1, status: 1 });
KundliRequestSchema.index({ astrologerId: 1, status: 1 });
KundliRequestSchema.index({ status: 1, createdAt: -1 });

const KundliRequest = model<TKundliRequest>("KundliRequest", KundliRequestSchema);
export default KundliRequest;
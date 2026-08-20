/* eslint-disable @typescript-eslint/no-explicit-any */
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
        userPhoneNumber: {
            type: String,
            required: true,
            trim: true,
        },

        // Birth Details - Made optional for analyzeKundli
        dateOfBirth: {
            type: Date,
            required: false, //Changed from true to false
        },
        timeOfBirth: {
            type: String,
            required: false, //Changed from true to false
        },
        placeOfBirth: {
            type: String,
            required: false, //Changed from true to false
            trim: true,
        },
        userGender: {
            type: String,
            enum: ["male", "female", "other"],
            required: false, //Changed from true to false
        },

        // Kundli
        kundliType: {
            type: String,
            enum: [
                "birthChart",
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
                "gemstone",
            ],
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

// Add pre-save validation for conditional required fields
KundliRequestSchema.pre("save", function (next) {
    // If requestType is "generateKundli", birth details are required
    if (this.requestType === "generateKundli") {
        if (!this.dateOfBirth || !this.timeOfBirth || !this.placeOfBirth || !this.userGender) {
            const error = new Error(
                "All birth details (dateOfBirth, timeOfBirth, placeOfBirth, userGender) are required for generating a new kundli"
            );
            return next(error);
        }
    }
    next();
});

// Add static method for validation (optional)
KundliRequestSchema.statics.validateRequest = function (requestType: string, data: any) {
    if (requestType === "generateKundli") {
        const requiredFields = ["dateOfBirth", "timeOfBirth", "placeOfBirth", "userGender"];
        const missingFields = requiredFields.filter(field => !data[field]);
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields for generateKundli: ${missingFields.join(", ")}`);
        }
    }
    return true;
};

const KundliRequest = model<TKundliRequest>("KundliRequest", KundliRequestSchema);
export default KundliRequest;
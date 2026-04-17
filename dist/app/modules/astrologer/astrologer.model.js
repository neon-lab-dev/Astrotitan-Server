"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Astrologer = void 0;
// astrologer.model.ts
const mongoose_1 = require("mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const astrologerSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
});
// Compound indexes for common queries (only if fields exist)
astrologerSchema.index({ firstName: 1, lastName: 1 });
astrologerSchema.index({ areaOfPractice: 1, country: 1 });
astrologerSchema.index({ consultLanguages: 1, isProfileCompleted: 1 });
astrologerSchema.index({ country: 1, isProfileCompleted: 1 });
// Text index for search functionality
astrologerSchema.index({
    firstName: "text",
    lastName: "text",
    displayName: "text",
    bio: "text",
    areaOfPractice: "text",
}, {
    weights: {
        firstName: 10,
        lastName: 10,
        displayName: 8,
        areaOfPractice: 5,
        bio: 3,
    },
    name: "astrologer_search_index",
});
exports.Astrologer = mongoose_2.default.models.Astrologer ||
    (0, mongoose_1.model)("Astrologer", astrologerSchema);

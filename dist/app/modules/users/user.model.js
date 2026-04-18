"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    accountId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        ref: "Accounts",
    },
    profilePicture: {
        type: String,
        trim: true,
    },
    firstName: {
        type: String,
        trim: true,
        maxlength: 100,
        index: true,
    },
    lastName: {
        type: String,
        trim: true,
        maxlength: 100,
        index: true,
    },
    fullName: {
        type: String,
        trim: true,
        index: true,
    },
    gender: {
        type: String,
        enum: ["male", "female", "non-binary", "other"],
        index: true,
    },
    dateOfBirth: {
        type: Date,
        index: true,
    },
    timeOfBirth: {
        type: String,
    },
    placeOfBirth: {
        type: String,
        trim: true,
        index: true,
    },
    intents: {
        type: [String],
        default: [],
        index: true,
    },
    country: {
        type: String,
        trim: true,
        index: true,
    },
    isProfileCompleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
// Compound indexes for common queries
userSchema.index({ firstName: 1, lastName: 1 });
userSchema.index({ gender: 1, dateOfBirth: 1 });
userSchema.index({ placeOfBirth: 1, intents: 1 });
// Text index for search functionality
userSchema.index({
    firstName: "text",
    lastName: "text",
    placeOfBirth: "text",
}, {
    weights: {
        firstName: 10,
        lastName: 10,
        placeOfBirth: 3,
    },
    name: "user_search_index",
});
exports.User = (0, mongoose_1.model)("User", userSchema);

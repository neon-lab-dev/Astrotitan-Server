"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Address = void 0;
// address.model.ts
const mongoose_1 = require("mongoose");
const addressSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ["home", "office", "other"],
        required: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
    },
    alternativePhoneNumber: {
        type: String,
        trim: true,
    },
    addressLine1: {
        type: String,
        required: true,
        trim: true,
    },
    addressLine2: {
        type: String,
        trim: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    state: {
        type: String,
        required: true,
        trim: true,
    },
    pinCode: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    country: {
        type: String,
        required: true,
        trim: true,
    },
}, {
    timestamps: true,
});
exports.Address = (0, mongoose_1.model)("Address", addressSchema);

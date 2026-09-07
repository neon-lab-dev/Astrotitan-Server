"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const SubscriptionPlanSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Plan name is required"],
        trim: true,
        unique: true,
        maxlength: [100, "Plan name cannot exceed 100 characters"],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"],
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price cannot be negative"],
    },
    duration: {
        type: Number,
        required: [true, "Duration is required"],
        min: [1, "Duration must be at least 1 day"],
        comment: "Duration in days",
    },
    numberOfConsultations: {
        type: String,
        required: [true, "Number of consultations is required"],
    },
    features: {
        type: [String],
        required: [true, "Features are required"],
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: "At least one feature is required",
        },
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// Indexes
SubscriptionPlanSchema.index({ name: 1 });
SubscriptionPlanSchema.index({ isActive: 1 });
SubscriptionPlanSchema.index({ price: 1 });
SubscriptionPlanSchema.index({ duration: 1 });
SubscriptionPlanSchema.index({ isActive: 1, price: 1 });
const SubscriptionPlan = (0, mongoose_1.model)("SubscriptionPlan", SubscriptionPlanSchema);
exports.default = SubscriptionPlan;

import { Schema, model } from "mongoose";
import { TSubscriptionPlan } from "./subscriptionPlan.interface";

const SubscriptionPlanSchema = new Schema<TSubscriptionPlan>(
    {
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
                validator: function (v: string[]) {
                    return v && v.length > 0;
                },
                message: "At least one feature is required",
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
SubscriptionPlanSchema.index({ name: 1 });
SubscriptionPlanSchema.index({ isActive: 1 });
SubscriptionPlanSchema.index({ price: 1 });
SubscriptionPlanSchema.index({ duration: 1 });
SubscriptionPlanSchema.index({ isActive: 1, price: 1 });

const SubscriptionPlan = model<TSubscriptionPlan>(
    "SubscriptionPlan",
    SubscriptionPlanSchema
);

export default SubscriptionPlan;
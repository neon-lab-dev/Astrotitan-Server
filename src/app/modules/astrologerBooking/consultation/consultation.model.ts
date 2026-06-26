import { model, Schema, Types } from "mongoose";
import { TConsultation } from "./consultation.interface";

const ConsultationSchema = new Schema<TConsultation>(
    {
        user: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        astrologer: {
            type: Types.ObjectId,
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
        requestMessage: {
            type: String,
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
            type: Types.ObjectId,
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
    },
    {
        timestamps: true,
    }
);

// Indexes
ConsultationSchema.index({ user: 1, status: 1 });
ConsultationSchema.index({ astrologer: 1, status: 1 });
ConsultationSchema.index({ status: 1, createdAt: -1 });
ConsultationSchema.index({ user: 1, astrologer: 1 });

const Consultation = model<TConsultation>("Consultation", ConsultationSchema);

export default Consultation;
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
            enum: ["pending", "scheduled", "ended"],
            default: "pending",
            index: true,
        },
        consultationFor: {
            type: String,
            required: true,
        },
        requestMessage: {
            type: String,
        },
        recommendations: {
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
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        review: {
            type: String,
            trim: true,
        },

        // Meeting fields
        slotId: {
            type: Types.ObjectId,
            ref: "Slot",
        },
        bookedSlotId: {
            type: Types.ObjectId,
        },

        meeting: {
            link: {
                type: String,
            },
            scheduledAt: {
                type: Date,
                index: true,
            },
            rescheduleRequest: {
                requestedTime: {
                    type: Date,
                },
                reason: {
                    type: String,
                },
                isRescheduled: {
                    type: Boolean,
                    default: false,
                },
            },
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
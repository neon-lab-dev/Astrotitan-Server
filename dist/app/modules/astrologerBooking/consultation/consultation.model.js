"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
//Reschedule request
const RescheduleRequestSchema = new mongoose_1.Schema({
    requestedTime: {
        type: Date,
        required: true,
    },
    reason: {
        type: String,
        trim: true,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
    respondedAt: {
        type: Date,
    },
}, {
    _id: false,
});
const CallSessionSchema = new mongoose_1.Schema({
    provider: {
        type: String,
        enum: ["zoom_video_sdk"],
        default: "zoom_video_sdk",
        required: true,
    },
    sessionName: {
        type: String,
        required: true,
        index: true,
    },
    sessionPassword: {
        type: String,
        select: false,
    },
    scheduledAt: {
        type: String,
        index: true,
    },
    rescheduleRequest: {
        type: RescheduleRequestSchema,
    },
}, {
    _id: false,
});
const ConsultationSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    astrologer: {
        type: mongoose_1.Types.ObjectId,
        ref: "Astrologer",
        required: true,
        index: true,
    },
    method: {
        type: String,
        enum: ["chat", "call"],
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ["pending", "scheduled", "ongoing", "ended"],
        default: "pending",
        index: true,
    },
    consultationFor: {
        type: String,
        required: true,
        trim: true,
    },
    requestMessage: {
        type: String,
        trim: true,
    },
    recommendations: {
        type: String,
        trim: true,
    },
    acceptedAt: {
        type: Date,
    },
    declinedAt: {
        type: Date,
    },
    startedAt: {
        type: Date,
    },
    endedAt: {
        type: Date,
    },
    endedBy: {
        type: mongoose_1.Types.ObjectId,
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
    slotId: {
        type: mongoose_1.Types.ObjectId,
        ref: "Slot",
        index: true,
    },
    bookedSlotId: {
        type: mongoose_1.Types.ObjectId,
    },
    callSession: {
        type: CallSessionSchema,
    },
}, {
    timestamps: true,
});
/**
 * Indexes
 */
ConsultationSchema.index({
    user: 1,
    status: 1,
});
ConsultationSchema.index({
    astrologer: 1,
    status: 1,
});
ConsultationSchema.index({
    status: 1,
    createdAt: -1,
});
ConsultationSchema.index({
    user: 1,
    astrologer: 1,
});
ConsultationSchema.index({
    "callSession.scheduledAt": 1,
});
ConsultationSchema.index({
    "callSession.sessionName": 1,
});
const Consultation = (0, mongoose_1.model)("Consultation", ConsultationSchema);
exports.default = Consultation;

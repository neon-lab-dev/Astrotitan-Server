import { ObjectId } from "mongoose";

export type ConsultationMethod = "chat" | "call";

export type ConsultationStatus =
    | "pending"
    | "accepted"
    | "rejected"
    | "ended";

export type RescheduleStatus =
    | "pending"
    | "accepted"
    | "rejected";

export type TRescheduleRequest = {
    requestedTime: Date;
    reason: string;
    status: RescheduleStatus;
    respondedAt?: Date;
};

export type TCallSession = {
    // Zoom Video SDK provider
    provider: "zoom_video_sdk";

    // Unique Zoom Video SDK session name
    sessionName: string;

    // Zoom session password
    sessionPassword?: string;

    // Scheduled consultation time
    scheduledAt: string;

    // Reschedule information
    rescheduleRequest?: TRescheduleRequest;
};

export type TConsultation = {
    _id: ObjectId;
    user: ObjectId;
    astrologer: ObjectId;
    method: ConsultationMethod;
    status: ConsultationStatus;
    consultationFor: string;
    requestMessage?: string;

    // Post-consultation review
    rating?: number;
    review?: string;

    recommendations?: string;

    slotId?: ObjectId;
    bookedSlotId?: ObjectId;

    // In-app Zoom Video SDK session
    callSession?: TCallSession;

    createdAt?: Date;
    updatedAt?: Date;
};
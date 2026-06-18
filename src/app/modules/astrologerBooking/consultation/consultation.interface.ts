import { ObjectId } from "mongoose";

export type TConsultation = {
    _id: string;
    user: ObjectId;           // User who requested
    astrologer: ObjectId;      // Astrologer who received the request
    method: "chat" | "call";         // Consultation method
    status: "pending" | "accepted" | "declined" | "ended";
    consultationFor: string;
    acceptedAt?: Date;
    declinedAt?: Date;
    endedAt?: Date;
    // endedBy?: "user" | "astrologer";
    startedAt?: Date;                // When chat actually started
    duration?: number;               // Duration in minutes (for call)
    rating?: number;
    review?: string;
    createdAt?: Date;
    updatedAt?: Date;
};
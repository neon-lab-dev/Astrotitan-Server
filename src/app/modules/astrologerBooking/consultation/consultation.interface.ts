import { ObjectId } from "mongoose";

export type TConsultation = {
    _id: string;
    user: ObjectId;           // User who requested
    astrologer: ObjectId;      // Astrologer who received the request
    method: "chat" | "call";         // Consultation method
    status: "pending" | "accepted" | "declined" | "scheduled" | "ended";
    consultationFor: string;
    requestMessage?: string; // if user wants to write a short message about his issue
    acceptedAt?: Date;
    declinedAt?: Date;
    endedAt?: Date;
    endedBy?: ObjectId;
    startedAt?: Date;                // When chat actually started
    rating?: number;
    review?: string;

    // If method is call, then meeting link will be generated and stored here
    meeting: {
        link: string;
        scheduledAt: Date;
        notes?: string;

        rescheduleRequest?: {
            requestedTime: Date;
            reason: string;
            isRescheduled: boolean;
        }
    }
    createdAt?: Date;
    updatedAt?: Date;
};
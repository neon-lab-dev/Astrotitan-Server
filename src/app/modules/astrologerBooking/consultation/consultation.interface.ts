import { ObjectId } from "mongoose";

export type TConsultation = {
    _id: string;
    user: ObjectId;           // User who requested
    astrologer: ObjectId;      // Astrologer who received the request
    method: "chat" | "call";         // Consultation method
    status: "pending" | "scheduled" | "ended";
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
    slotId?: ObjectId;
    bookedSlotId?: ObjectId;
    recommendations?: string;
    meeting: {
        link: string;
        scheduledAt: Date;

        rescheduleRequest?: {
            requestedTime: Date;
            reason: string;
            isRescheduled: boolean;
        }
    };
    createdAt?: Date;
    updatedAt?: Date;
};
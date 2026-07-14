import { ObjectId } from "mongoose";

export type TConsultation = {
    _id: string;
    user: ObjectId;           // User who requested
    astrologer: ObjectId;      // Astrologer who received the request
    method: "chat" | "call";         // Consultation method
    status: "pending" | "accepted" | "declined" | "ended";
    consultationFor: string;
    requestMessage?: string; // if user wants to write a short message about his issue
    acceptedAt?: Date;
    declinedAt?: Date;
    endedAt?: Date;
    endedBy?: ObjectId;
    startedAt?: Date;                // When chat actually started
    rating?: number;
    review?: string;

    // for call
    callRoomId?: string;
    callStatus?: "idle" | "ringing" | "connected" | "declined" | "ended";
    callStartedAt?: Date;
    callEndedAt?: Date;
    callDuration?: number;
    createdAt?: Date;
    updatedAt?: Date;
};
import { ObjectId } from "mongoose";

export type TKundliType =
    | "birthChart"
    | "compatibility"
    | "career"
    | "marriage"
    | "yearly"
    | "love"
    | "health"
    | "finance"
    | "education"
    | "business"
    | "child"
    | "foreignTravel"
    | "property"
    | "doshaAnalysis"
    | "gemstone";

export type TKundliRequest = {
    userId: ObjectId;
    astrologerId?: ObjectId;
    requestType: "generateKundli" | "analyzeKundli";

    existingKundliFiles?: string[];  // if requestType is "analyzeKundli"

    // User Snapshot
    userName: string;
    userPhoneNumber: string;

    // Birth Details
    dateOfBirth: Date;
    timeOfBirth: string;
    placeOfBirth: string;
    userGender: "male" | "female" | "other";

    // Kundli
    kundliType: TKundliType;

    userNotes?: string;

    // Status
    status:
    | "pending"
    | "accepted"
    | "rejected"
    | "completed"
    | "cancelled";

    // Result
    reportUrl?: string;

    completedAt?: Date;
    cancelledAt?: Date;

    isAssigned ?: boolean
};
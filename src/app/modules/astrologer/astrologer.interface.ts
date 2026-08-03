export type TLoginAuth = {
    email: string;
    role?: string
    password: string;
};

import { Model, ObjectId } from "mongoose";
import { UserRole } from "../accounts/accounts.constants";

export type TAstrologerReview = {
    user: ObjectId;
    review: string;
    rating: number;
    createdAt?: Date;
    updatedAt?: Date;
};

export type TAstrologer = {
    _id: string;
    accountId?: string;
    profilePicture?: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    phoneNumber?: string;
    gender: string;
    consultLanguages: string[];
    areaOfPractice: string[];
    experience: "1" | "2" | "3" | "4" | "5" | "5+" | "10+" | "15+" | "20+";
    bio?: string;
    country: string;
    identity: {
        identityType: "aadharCard" | "panCard";
        frontSide: string;
        backSide: string;
        status: "pending" | "approved" | "rejected";
        rejectedReason?: string;
    }
    isIdentityVerified: boolean;
    isProfileCompleted: boolean;
    rating?: number;
    reviews?: TAstrologerReview[];
    availability?: {
        availableDays: string[];
        availableTime: {
            startTime: string;
            endTime: string;
        };
    };

    googleCalendar?: {
        accessToken?: string;
        refreshToken?: string;
        tokenExpiry?: Date;
        email?: string;
        calendarId?: string;
        isConnected?: boolean;
    };
};

export interface AstrologerModel extends Model<TAstrologer> {
    isUserExists(email: string): Promise<TAstrologer>;
}

export type TUserRole = keyof typeof UserRole;

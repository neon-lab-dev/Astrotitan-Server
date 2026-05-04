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
    experience: string;
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
};

export interface AstrologerModel extends Model<TAstrologer> {
    isUserExists(email: string): Promise<TAstrologer>;
}

export type TUserRole = keyof typeof UserRole;

export type TLoginAuth = {
    email: string;
    role?: string
    password: string;
};

import { Model } from "mongoose";
import { UserRole } from "../accounts/accounts.constants";

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
    }
    isProfileCompleted: boolean;
};

export interface AstrologerModel extends Model<TAstrologer> {
    isUserExists(email: string): Promise<TAstrologer>;
}

export type TUserRole = keyof typeof UserRole;

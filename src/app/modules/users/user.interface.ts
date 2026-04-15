export type TLoginAuth = {
    email: string;
    role?: string
    password: string;
};

import { Model } from "mongoose";
import { UserRole } from "../accounts/accounts.constants";

export type TUser = {
    _id: string;
    accountId ?: string;
    profilePicture?: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    gender: string;
    dateOfBirth: Date;
    timeOfBirth: string;
    placeOfBirth: string;
    intents: string[];
    isProfileCompleted: boolean;
};

export interface UserModel extends Model<TUser> {
    isUserExists(email: string): Promise<TUser>;
    isPasswordMatched(
        plainTextPassword: string,
        hashedPassword: string
    ): Promise<boolean>;
}

export type TUserRole = keyof typeof UserRole;

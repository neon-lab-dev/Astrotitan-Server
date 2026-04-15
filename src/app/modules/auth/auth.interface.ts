export type TLoginAuth = {
  email: string;
  role?: string
  password: string;
};

import { Model } from "mongoose";
import { UserRole } from "./auth.constants";

export type TUser = {
  _id: string;
  userId: string;
  profilePicture?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  gender: string;
  dateOfBirth: Date;
  timeOfBirth: string;
  placeOfBirth: string;
  intents: string[];
  password: string;
  role: "user" | "admin" | "astrologer";
  isDeleted?: boolean;
  isSuspended?: boolean;
  isOtpVerified?: boolean;
  otp?: string | null;
  otpExpireAt?: Date | null;
  resetOtp?: string | null;
  resetOtpExpireAt?: Date | null;
  isResetOtpVerified?: boolean | null;
  createdAt?: Date;
  updatedAt?: Date;
  passwordChangedAt?: Date;
  suspensionReason?: string | null;
  accountDeleteReason?: string | null;
  expoPushToken?: string | null;
};

export interface UserModel extends Model<TUser> {
  isUserExists(email: string): Promise<TUser>;
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string
  ): Promise<boolean>;
}

export type TUserRole = keyof typeof UserRole;

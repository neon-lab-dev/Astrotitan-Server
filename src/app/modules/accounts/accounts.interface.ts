
import { Model } from "mongoose";
import { UserRole } from "./accounts.constants";

export type TLoginAuth = {
  email?: string;
  phoneNumber?: string;
  role: "user" | "astrologer";
};

export type TAccounts = {
  _id: string;
  email?: string;
  phoneNumber?: string;
  role: "user" | "admin" | "astrologer";
  isDeleted?: boolean;
  isSuspended?: boolean;
  isOtpVerified?: boolean;
  otp?: string | null;
  otpExpireAt?: Date | null;
  resetOtp?: string | null;
  resetOtpExpireAt?: Date | null;
  loginOtp ?: string | null;
  loginOtpExpireAt ?: Date | null;
  isResetOtpVerified?: boolean | null;
  createdAt?: Date;
  updatedAt?: Date;
  passwordChangedAt?: Date;
  suspensionReason?: string | null;
  accountDeleteReason?: string | null;
  expoPushToken?: string | null;
};

export interface UserModel extends Model<TAccounts> {
  isUserExists(email: string): Promise<TAccounts>;
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string
  ): Promise<boolean>;
}

export type TUserRole = keyof typeof UserRole;

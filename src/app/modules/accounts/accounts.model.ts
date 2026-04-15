import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import { TAccounts, UserModel } from "./accounts.interface";

// function generateUserId() {
//   const prefix = "AST";
//   const date = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
//   const random = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6-char random
//   return `${prefix}-${date}-${random}`;
// }

const userSchema = new Schema<TAccounts, UserModel>(
  {
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
      sparse: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "astrologer"],
      required: true,
      default: "user",
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
      index: true,
    },
    isOtpVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpireAt: {
      type: Date,
      default: null,
      index: true,
    },
    resetOtp: {
      type: String,
      default: null,
    },
    resetOtpExpireAt: {
      type: Date,
      default: null,
    },
    isResetOtpVerified: {
      type: Boolean,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
    },
    suspensionReason: {
      type: String,
      trim: true,
      default: null,
    },
    accountDeleteReason: {
      type: String,
      trim: true,
      default: null,
    },
    expoPushToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common query patterns
userSchema.index({ role: 1, isDeleted: 1 });
userSchema.index({ role: 1, isSuspended: 1 });
userSchema.index({ isDeleted: 1, isSuspended: 1 });
userSchema.index({ role: 1, isOtpVerified: 1 });
userSchema.index({ createdAt: -1 }); // For sorting by recent
userSchema.index({ updatedAt: -1 });

// Text index for search functionality (firstName, lastName, email, placeOfBirth)
userSchema.index(
  {
    firstName: "text",
    lastName: "text",
    email: "text",
    placeOfBirth: "text",
  },
  {
    weights: {
      firstName: 10, // Higher weight = more relevant
      lastName: 10,
      email: 5,
      placeOfBirth: 3,
    },
    name: "user_search_index",
  }
);

// Compound index for filtering by intents (array field)
userSchema.index({ intents: 1, role: 1, isDeleted: 1 });

// Compound index for date range queries
userSchema.index({ dateOfBirth: 1, role: 1 });

// Index for OTP expiration cleanup
userSchema.index(
  { otpExpireAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { isOtpVerified: false } }
);

// Remove password from response
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Static methods
userSchema.statics.isUserExists = async function (email: string) {
  return await this.findOne({ email }).select("+password");
};

userSchema.statics.isPasswordMatched = async function (
  plainTextPassword: string,
  hashedPassword: string
) {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};

export const Accounts = model<TAccounts, UserModel>("Accounts", userSchema);
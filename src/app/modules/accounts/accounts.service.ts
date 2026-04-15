/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../../config";
import { createToken } from "./accounts.utils";
import { Accounts } from "./accounts.model";
import axios from "axios";
import Expo from "expo-server-sdk";
import { sendEmail } from "../../utils/sendEmail";
import { User } from "../users/user.model";

const signup = async (payload: {
  email?: string;
  phoneNumber?: string;
  role: "user" | "astrologer";
}) => {
  // Validate input
  if (!payload.email && !payload.phoneNumber) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Either email or phone number is required"
    );
  }

  // Check if user already exists in Auth collection
  if (payload.email) {
    const existingUser = await Accounts.findOne({ email: payload.email });
    if (existingUser) {
      throw new AppError(
        httpStatus.CONFLICT,
        "User already exists with this email"
      );
    }
  }

  if (payload.phoneNumber) {
    const existingUser = await Accounts.findOne({ phoneNumber: payload.phoneNumber });
    if (existingUser) {
      throw new AppError(
        httpStatus.CONFLICT,
        "User already exists with this phone number"
      );
    }
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Create temporary signup record (NOT the actual user yet)
  const signupPayload = {
    email: payload.email || null,
    phoneNumber: payload.phoneNumber || null,
    role: payload.role,
    otp,
    otpExpireAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
  };



  // Send OTP
  if (payload.phoneNumber) {
    // Send SMS
    try {
      const message = `Your OTP for Astrotitan is ${otp}. Valid for 2 minutes.`;
      const smsUrl = `https://smsapi?api_key=${config.sms_provider_api_key}&type=text&contacts=${payload.phoneNumber}&senderid=${config.sms_sender_id}&msg=${encodeURIComponent(message)}`;
      await axios.get(smsUrl);
    } catch (error) {
      console.error("❌ Failed to send OTP SMS:", error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to send OTP SMS"
      );
    }
  } else if (payload.email) {
    // Send Email
    const subject = "Verify Your OTP - Astrotitan";
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; background:#f9f9f9; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; padding:30px;">
          <h2 style="color:#D4AF37; text-align:center;">Astrotitan</h2>
          <p>Your OTP for verification is: <strong style="font-size:24px;">${otp}</strong></p>
          <p>This OTP is valid for <strong>2 minutes</strong>.</p>
          <p>Best regards,<br/>The Astrotitan Team</p>
        </div>
      </div>
    `;
    await sendEmail(payload.email, subject, htmlBody);
  }

  await Accounts.create(signupPayload);

  return {};
};

const verifySignupOtp = async (emailOrPhone: string, otp: string) => {
  // 1. Find account by email or phone number
  const account = await Accounts.findOne({
    $or: [
      { email: emailOrPhone },
      { phoneNumber: emailOrPhone }
    ]
  });

  if (!account) {
    throw new AppError(httpStatus.NOT_FOUND, "Account not found.");
  }

  if (account.isOtpVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP is already verified.");
  }

  if (!account.otp || account.otp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP.");
  }

  if (account.otpExpireAt && account.otpExpireAt < new Date()) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP has expired.");
  }

  // 2. Mark OTP as verified
  account.isOtpVerified = true;
  account.otp = null;
  account.otpExpireAt = null;
  await account.save();

  const roleBasedId = "";

  // 3. Create role-specific profile if not exists
  if (account.role === "user") {
    const existingUser = await User.findOne({ accountId: account._id });
    if (!existingUser) {
      const userProfile = await User.create({
        accountId: account._id,
      });
    }
  }

  // if (account.role === "astrologer") {
  //   const existingAstrologer = await Astrologer.findOne({ accountId: account._id });
  //   if (!existingAstrologer) {
  //     const astrologerProfile = await Astrologer.create({
  //       accountId: account._id,
  //       firstName: "",
  //       lastName: "",
  //       gender: "",
  //       dateOfBirth: null,
  //       timeOfBirth: "",
  //       placeOfBirth: "",
  //       expertise: [],
  //       experience: 0,
  //       languages: [],
  //       isVerified: false,
  //       isProfileComplete: false,
  //     });
  //     roleBasedId = astrologerProfile._id.toString();
  //   } else {
  //     roleBasedId = existingAstrologer._id.toString();
  //     isProfileComplete = existingAstrologer.isProfileComplete || false;
  //   }
  // }

  // 4. JWT Payload
  const jwtPayload = {
    _id: account._id.toString(),
    email: account.email,
    role: account.role,
    roleBasedId,
  };

  // 5. Generate Tokens
  const accessToken = createToken(
    jwtPayload as any,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload as any,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  return {
    success: true,
    message: "OTP verified successfully. Please complete your profile.",
    accessToken,
    refreshToken,
    user: {
      _id: account._id,
      email: account.email,
      phoneNumber: account.phoneNumber,
      role: account.role,
      roleBasedId,
      isOtpVerified: account.isOtpVerified,
    },
  };
};

const resendSignupOtp = async (emailOrPhone: string) => {
  // 1. Find account by email or phone number
  const account = await Accounts.findOne({
    $or: [
      { email: emailOrPhone },
      { phoneNumber: emailOrPhone }
    ]
  });

  if (!account) {
    throw new AppError(httpStatus.NOT_FOUND, "Account not found.");
  }

  if (account.isOtpVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account already verified.");
  }

  // 2. Generate new 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 3. Update account with new OTP
  account.otp = otp;
  account.otpExpireAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes expiry
  await account.save();

  // 4. Send OTP via appropriate channel
  if (account.phoneNumber) {
    // Send via SMS
    try {
      const message = `Your new verification code for Astrotitan is ${otp}. This code will expire in 2 minutes.`;

      const smsUrl = `https://sms.mram.com.bd/smsapi?api_key=${config.sms_provider_api_key}&type=text&contacts=${account.phoneNumber}&senderid=${config.sms_sender_id}&msg=${encodeURIComponent(message)}`;

      await axios.get(smsUrl);
    } catch (error) {
      console.error("❌ Failed to resend OTP via SMS:", error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to resend OTP. Please try again."
      );
    }
  } else if (account.email) {
    // Send via Email
    try {
      const subject = "Resend: Verify Your OTP - Astrotitan";
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; background:#f9f9f9; padding:20px;">
          <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; padding:30px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
            <h2 style="color:#D4AF37; text-align:center;">Astrotitan</h2>
            <p style="font-size:16px; color:#333;">Hello,</p>
            <p style="font-size:15px; color:#555;">
              You requested a new OTP. Please use the code below to verify your account.
              This OTP is valid for <strong>2 minutes</strong>.
            </p>
            <div style="text-align:center; margin:30px 0;">
              <p style="font-size:32px; letter-spacing:4px; font-weight:bold; color:#D4AF37;">${otp}</p>
            </div>
            <p style="font-size:14px; color:#777;">
              If you didn't request this, you can safely ignore this email.
            </p>
            <p style="font-size:15px; color:#333; margin-top:30px;">Best regards,</p>
            <p style="font-size:16px; font-weight:bold; color:#D4AF37;">The Astrotitan Team</p>
          </div>
        </div>
      `;

      await sendEmail(account.email, subject, htmlBody);
    } catch (error) {
      console.error("❌ Failed to resend OTP via Email:", error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to resend OTP. Please try again."
      );
    }
  }

  return {
    success: true,
    message: "OTP resent successfully",
    identifier: account.email || account.phoneNumber,
  };
};

// Login
// auth.service.ts

// Step 1: Request OTP for login
const login = async (payload: {
  email?: string;
  phoneNumber?: string;
  role: "user" | "astrologer";
}) => {
  // Validate input
  if (!payload.email && !payload.phoneNumber) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Either email or phone number is required"
    );
  }

  // Find account by email or phone
  const account = await Accounts.findOne({
    $or: [
      { email: payload.email },
      { phoneNumber: payload.phoneNumber }
    ]
  });

  if (!account) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No account found. Please sign up first."
    );
  }

  // Check if account is deleted or suspended
  if (account.isDeleted) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account has been deleted. Please contact support."
    );
  }

  if (account.isSuspended) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account has been suspended. Please contact support."
    );
  }

  // Check if OTP is verified during signup
  if (!account.isOtpVerified) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is not verified. Please complete your signup verification first."
    );
  }

  // Generate 6-digit OTP for login
  const loginOtp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save login OTP to account
  account.loginOtp = loginOtp;
  account.loginOtpExpireAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes expiry
  await account.save();

  // Send OTP via appropriate channel
  if (account.phoneNumber) {
    // Send via SMS
    try {
      const message = `Your Astrotitan login OTP is ${loginOtp}. Valid for 5 minutes. Do not share this code with anyone.`;

      const smsUrl = `https://sms.mram.com.bd/smsapi?api_key=${config.sms_provider_api_key}&type=text&contacts=${account.phoneNumber}&senderid=${config.sms_sender_id}&msg=${encodeURIComponent(message)}`;

      await axios.get(smsUrl);
    } catch (error) {
      console.error("❌ Failed to send login OTP via SMS:", error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to send OTP. Please try again."
      );
    }
  } else if (account.email) {
    // Send via Email
    try {
      const subject = "Your Login OTP - Astrotitan";
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; background:#f9f9f9; padding:20px;">
          <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; padding:30px;">
            <h2 style="color:#D4AF37; text-align:center;">Astrotitan</h2>
            <p>Hello,</p>
            <p>Use the following OTP to login to your Astrotitan account:</p>
            <div style="text-align:center; margin:30px 0;">
              <p style="font-size:32px; letter-spacing:4px; font-weight:bold; color:#D4AF37;">${loginOtp}</p>
            </div>
            <p>This OTP is valid for <strong>5 minutes</strong>.</p>
            <p style="color:#777;">If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br/>The Astrotitan Team</p>
          </div>
        </div>
      `;

      await sendEmail(account.email, subject, htmlBody);
    } catch (error) {
      console.error("❌ Failed to send login OTP via Email:", error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to send OTP. Please try again."
      );
    }
  }

  return {
    success: true,
    message: "Login OTP sent successfully",
    identifier: account.email || account.phoneNumber,
    role: account.role,
  };
};

// Step 2: Verify OTP and login
const verifyLoginOtp = async (payload: {
  email?: string;
  phoneNumber?: string;
  otp: string;
}) => {
  // Find account by email or phone
  const account = await Accounts.findOne({
    $or: [
      { email: payload.email },
      { phoneNumber: payload.phoneNumber }
    ]
  });

  if (!account) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Account not found. Please sign up first."
    );
  }

  // Verify OTP
  if (!account.loginOtp || account.loginOtp !== payload.otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP.");
  }

  if (account.loginOtpExpireAt && account.loginOtpExpireAt < new Date()) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP has expired. Please request a new one.");
  }

  // Clear login OTP after successful verification
  account.loginOtp = null;
  account.loginOtpExpireAt = null;
  await account.save();

  // Get role-based profile
  let roleBasedId = "";

  if (account.role === "user") {
    const userProfile = await Accounts.findOne({ accountId: account._id });
    if (userProfile) {
      roleBasedId = userProfile._id.toString();
    }
  }

  // if (account.role === "astrologer") {
  //   const astrologerProfile = await Astrologer.findOne({ accountId: account._id });
  //   if (astrologerProfile) {
  //     roleBasedId = astrologerProfile._id.toString();
  //     isProfileComplete = astrologerProfile.isProfileComplete || false;
  //   }
  // }

  // JWT Payload
  const jwtPayload = {
    _id: account._id.toString(),
    email: account.email,
    phoneNumber: account.phoneNumber,
    role: account.role,
    roleBasedId,
  };

  // Generate Tokens
  const accessToken = createToken(
    jwtPayload as any,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload as any,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  return {
    success: true,
    message: "Login successful",
    accessToken,
    refreshToken,
    user: {
      _id: account._id,
      email: account.email,
      phoneNumber: account.phoneNumber,
      role: account.role,
      roleBasedId,
    },
  };
};

// Resend login OTP
const resendLoginOtp = async (payload: {
  email?: string;
  phoneNumber?: string;
}) => {
  // Find account
  const account = await Accounts.findOne({
    $or: [
      { email: payload.email },
      { phoneNumber: payload.phoneNumber }
    ]
  });

  if (!account) {
    throw new AppError(httpStatus.NOT_FOUND, "Account not found.");
  }

  // Check if account is active
  if (account.isDeleted || account.isSuspended) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is not active. Please contact support."
    );
  }

  // Generate new OTP
  const loginOtp = Math.floor(100000 + Math.random() * 900000).toString();

  // Update account with new OTP
  account.loginOtp = loginOtp;
  account.loginOtpExpireAt = new Date(Date.now() + 5 * 60 * 1000);
  await account.save();

  // Send OTP (same as above)
  // ... (same OTP sending logic as requestLoginOtp)

  return {
    success: true,
    message: "Login OTP resent successfully",
  };
};

const refreshToken = async (token: string) => {
  // Checking if there is any token sent from the client or not.
  if (!token) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized to proceed!"
    );
  }

  // Checking if the token is valid or not.
  const decoded = jwt.verify(
    token,
    config.jwt_refresh_secret as string
  ) as JwtPayload;

  const { email } = decoded;

  const user = await Accounts.isUserExists(email);
  await Accounts.findOneAndUpdate({ _id: user._id }, { $set: { isOtpVerified: true } });

  // Checking if the user exists or not
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  // Checking if the user already deleted or not
  const isUserDeleted = user?.isDeleted;
  if (isUserDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User does not exists.");
  }

  // Have to check if the user is suspended or not

  const jwtPayload = {
    _id: user._id.toString(),
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    createdAt: user.createdAt,
    isOtpVerified: user.isOtpVerified,
  };

  const accessToken = createToken(
    jwtPayload as any,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  return {
    accessToken,
    user: {
      _id: user._id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      createdAt: user.createdAt,
      isOtpVerified: user.isOtpVerified,
    },
  };
};

// Change user role (For admin)
const changeUserRole = async (payload: { userId: string; role: any }) => {
  const user = await User.findById(payload?.userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const result = await User.findByIdAndUpdate(
    payload?.userId,
    { role: payload?.role },
    {
      new: true,
      runValidators: true,
    }
  );

  return result;
};

export const AuthServices = {
  signup,
  verifySignupOtp,
  resendSignupOtp,
  login,
  verifyLoginOtp,
  resendLoginOtp,
  refreshToken,
  changeUserRole,
};

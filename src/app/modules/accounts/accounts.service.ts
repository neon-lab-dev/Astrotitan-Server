/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../../config";
import { createToken } from "./accounts.utils";
import { Accounts } from "./accounts.model";
import axios from "axios";
import { sendEmail } from "../../utils/sendEmail";
import { User } from "../users/user.model";
import { generateOtp } from "../../utils/generateOtp";
import { Astrologer } from "../astrologer/astrologer.model";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { TLoginAuth } from "./accounts.interface";
import bcrypt from 'bcrypt';

const signup = async (payload: {
  email?: string;
  phoneNumber?: string;
  role: "user" | "astrologer" | "admin";
  password?: string;
}) => {
  // Validating for admin registration (only one admin allowed)
  if (payload.role === "admin") {
    const existingAdmin = await Accounts.findOne({ role: "admin" });
    if (existingAdmin) {
      throw new AppError(httpStatus.CONFLICT, "Admin already exists. Only one admin can be registered.");
    }

    // Admin must have password
    if (!payload.password) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Password is required for admin registration"
      );
    }
  }

  // Validate input for non-admin users
  if (payload.role !== "admin" && !payload.email && !payload.phoneNumber) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Either email or phone number is required"
    );
  }

  // Check if user already exists in Accounts collection
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

  // Generate OTP (only for non-admin users)
  const otp = payload.role !== "admin" ? generateOtp() : null;

  // Prepare account data
  const accountData: any = {
    email: payload.email || null,
    phoneNumber: payload.phoneNumber || null,
    role: payload.role,
    isOtpVerified: payload.role === "admin" ? true : false, // Admin is auto-verified
    otp: otp,
    otpExpireAt: payload.role !== "admin" ? new Date(Date.now() + 2 * 60 * 1000) : null,
  };

  // Hash password for admin
  if (payload.role === "admin" && payload.password) {
    const hashedPassword = await bcrypt.hash(
      payload.password,
      Number(config.bcrypt_salt_round)
    );
    accountData.password = hashedPassword;
  }

  // Create account
  const account = await Accounts.create(accountData);

  // Send OTP only for non-admin users
  if (payload.role !== "admin") {
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
  }

  return {
    success: true,
    message: payload.role === "admin"
      ? "Admin account created successfully"
      : "OTP sent successfully. Please verify your account."
  };
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

  // 3. Create role-specific profile if not exists
  if (account.role === "user") {
    const existingUser = await User.findOne({ accountId: account._id });
    if (!existingUser) {
      await User.create({
        accountId: account._id,
      });
    }
  }
  if (account.role === "astrologer") {
    const existingAstrologer = await Astrologer.findOne({ accountId: account._id });
    if (!existingAstrologer) {
      await Astrologer.create({
        accountId: account._id,
      });
    }
  }

  // 4. JWT Payload
  const jwtPayload = {
    _id: account._id.toString(),
    email: account.email,
    role: account.role,
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

  const user = await User.findOne({ accountId: account._id });
  // const astrologer = await Astrologer.findOne({ accountId: account._id });

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
      isOtpVerified: account.isOtpVerified,
      isProfileCompleted: user ? user.isProfileCompleted : false
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
  const otp = generateOtp();

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

const completeProfile = async (
  accountId: string,
  payload: any,
  files?: {
    profilePicture?: Express.Multer.File[];
    identityFront?: Express.Multer.File[];
    identityBack?: Express.Multer.File[];
  }
) => {

  // Upload profile picture
  let profilePictureUrl = "";
  if (files?.profilePicture?.[0]) {
    const uploaded = await sendImageToCloudinary(
      files.profilePicture[0].originalname,
      files.profilePicture[0].path
    );
    profilePictureUrl = uploaded.secure_url;
  }

  // Upload identity front
  let frontSideUrl = "";
  if (files?.identityFront?.[0]) {
    const uploaded = await sendImageToCloudinary(
      files.identityFront[0].originalname,
      files.identityFront[0].path
    );
    frontSideUrl = uploaded.secure_url;
  }

  // Upload identity back
  let backSideUrl = "";
  if (files?.identityBack?.[0]) {
    const uploaded = await sendImageToCloudinary(
      files.identityBack[0].originalname,
      files.identityBack[0].path
    );
    backSideUrl = uploaded.secure_url;
  }

  // Checking if account exists
  const account = await Accounts.findById(accountId);
  if (!account) {
    throw new AppError(httpStatus.NOT_FOUND, "Account not found.");
  }

  // Checking if account is verified
  if (!account.isOtpVerified) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Please verify your account first."
    );
  }

  // Parsing array fields
  const parseArrayField = (field: any) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [field];
      } catch (e) {
        return [field];
      }
    }
    return [];
  };

  // Payload
  const cleanedPayload = {
    ...payload,
    consultLanguages: parseArrayField(payload.consultLanguages),
    areaOfPractice: parseArrayField(payload.areaOfPractice),
    fullName : payload.firstName + " " + payload.lastName
  };

  let profile;

  // Role-based profile creation
  if (account.role === "user") {
    profile = await User.findOneAndUpdate(
      { accountId: accountId },
      { ...cleanedPayload, isProfileCompleted: true },
      { new: true, upsert: true }
    );
  }
  else if (account.role === "astrologer") {
    // Astrologer data
    const astrologerData = {
      accountId: account._id,
      identity: {
        identityType: payload.identityType,
        frontSide: frontSideUrl || payload.frontSide,
        backSide: backSideUrl || payload.backSide,
      },
      profilePicture: profilePictureUrl || payload.profilePicture || "",
      isProfileCompleted: true,
      ...cleanedPayload,
    };

    // Validating identity for astrologer
    if (!astrologerData.identity.identityType) {
      throw new AppError(httpStatus.BAD_REQUEST, "Identity type is required for astrologer");
    }
    if (!astrologerData.identity.frontSide) {
      throw new AppError(httpStatus.BAD_REQUEST, "Front side of identity document is required");
    }
    if (!astrologerData.identity.backSide) {
      throw new AppError(httpStatus.BAD_REQUEST, "Back side of identity document is required");
    }

    profile = await Astrologer.findOneAndUpdate(
      { accountId: accountId },
      astrologerData,
      { new: true, upsert: true }
    );
  }

  await Accounts.findByIdAndUpdate(accountId, {
    firstName: payload.firstName,
    lastName: payload.lastName,
    phoneNumber: payload.phoneNumber,
    gender: payload.gender,
    profilePicture: profilePictureUrl || payload.profilePicture || "",
  });

  return {
    success: true,
    message: "Profile completed successfully",
    data: profile,
  };
};

// Login
const login = async (payload: {
  email?: string;
  phoneNumber?: string;
  role: "user" | "astrologer" | "admin";
}) => {
  // Validate input
  if (!payload.email && !payload.phoneNumber) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Either email or phone number is required"
    );
  }

  // Build query dynamically (remove undefined/null values)
  const query: any = {
    $or: []
  };

  if (payload.email) {
    query.$or.push({ email: payload.email });
  }
  if (payload.phoneNumber) {
    query.$or.push({ phoneNumber: payload.phoneNumber });
  }

  // If both are provided, find by either
  // If only one is provided, find by that only
  const account = await Accounts.findOne(query);

  if (!account) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No account found. Please sign up first."
    );
  }

  // Check role mismatch
  if (account.role !== payload.role) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      `This account is registered as a ${account.role}. Please select the correct account type.`
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

  // Generate 4-digit OTP for login
  const loginOtp = generateOtp();

  // Save login OTP to account
  account.loginOtp = loginOtp;
  account.loginOtpExpireAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes expiry
  await account.save();

  // Send OTP via appropriate channel
  if (payload.phoneNumber) {
    // Send via SMS
    try {
      const message = `Your Astrotitan login OTP is ${loginOtp}. Valid for 2 minutes. Do not share this code with anyone.`;

      const smsUrl = `https://sms.mram.com.bd/smsapi?api_key=${config.sms_provider_api_key}&type=text&contacts=${payload.phoneNumber}&senderid=${config.sms_sender_id}&msg=${encodeURIComponent(message)}`;

      await axios.get(smsUrl);
    } catch (error) {
      console.error("❌ Failed to send login OTP via SMS:", error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to send OTP. Please try again."
      );
    }
  } else if (payload.email) {
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
            <p>This OTP is valid for <strong>2 minutes</strong>.</p>
            <p style="color:#777;">If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br/>The Astrotitan Team</p>
          </div>
        </div>
      `;

      await sendEmail(payload.email as string, subject, htmlBody);
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
    identifier: payload.email || payload.phoneNumber,
    role: account.role,
  };
};

// Step 2: Verify OTP and login
const verifyLoginOtp = async (payload: {
  emailOrPhone: string;
  otp: string;
}) => {
  // Find account by email or phone
  const account = await Accounts.findOne({
    $or: [
      { email: payload.emailOrPhone },
      { phoneNumber: payload.emailOrPhone }
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

  const user = await User.findOne({ accountId: account._id });
  // const astrologer = await Astrologer.findOne({ accountId: account._id });

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
      isProfileCompleted: user?.isProfileCompleted || false
    },
  };
};

// Resend login OTP
const resendLoginOtp = async (payload: {
  emailOrPhone: string;
}) => {
  // Find account
  const account = await Accounts.findOne({
    $or: [
      { email: payload.emailOrPhone },
      { phoneNumber: payload.emailOrPhone }
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

  // Check if account is verified
  if (!account.isOtpVerified) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is not verified. Please complete signup verification first."
    );
  }

  // Generate new 6-digit OTP
  const loginOtp = generateOtp();

  // Update account with new OTP (2 minutes expiry)
  account.loginOtp = loginOtp;
  account.loginOtpExpireAt = new Date(Date.now() + 2 * 60 * 1000);
  await account.save();

  // Send OTP via appropriate channel
  if (account.phoneNumber) {
    // Send via SMS
    try {
      const message = `Your Astrotitan login OTP is ${loginOtp}. This code is valid for 2 minutes. Do not share this code with anyone.`;

      const smsUrl = `https://sms.mram.com.bd/smsapi?api_key=${config.sms_provider_api_key}&type=text&contacts=${account.phoneNumber}&senderid=${config.sms_sender_id}&msg=${encodeURIComponent(message)}`;

      await axios.get(smsUrl);
    } catch (error) {
      console.error("❌ Failed to resend login OTP via SMS:", error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to resend OTP. Please try again."
      );
    }
  } else if (account.email) {
    // Send via Email
    try {
      const subject = "Your Login OTP - Astrotitan";
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; background:#f9f9f9; padding:20px;">
          <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; padding:30px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
            <h2 style="color:#D4AF37; text-align:center;">Astrotitan</h2>
            <p style="font-size:16px; color:#333;">Hello,</p>
            <p style="font-size:15px; color:#555;">
              You requested a new login OTP. Please use the code below to login to your account.
            </p>
            <div style="text-align:center; margin:30px 0;">
              <p style="font-size:32px; letter-spacing:4px; font-weight:bold; color:#D4AF37;">${loginOtp}</p>
            </div>
            <p style="font-size:14px; color:#777;">
              This OTP is valid for <strong>2 minutes</strong>.
            </p>
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
      console.error("❌ Failed to resend login OTP via Email:", error);
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to resend OTP. Please try again."
      );
    }
  }

  return {
    success: true,
    message: "Login OTP resent successfully",
    identifier: account.email || account.phoneNumber,
  };
};

const loginAdmin = async (payload: TLoginAuth) => {
  // Check if user exists
  const user = await Accounts.isUserExists(payload.email || "");

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No account found with this email address. Please sign up first."
    );
  }

  // 7️Password validation
  const isPasswordMatched = await Accounts.isPasswordMatched(
    payload.password as string,
    user.password as string
  );

  if (!isPasswordMatched) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Incorrect password. Please try again."
    );
  }

  // JWT Payload
  const jwtPayload = {
    _id: user._id.toString(),
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
  };

  // Tokens
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
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
    },
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

// Suspend user
const suspendAccount = async (accountId: string, payload: any) => {
  const user = await Accounts.findById(accountId);
  if (!user) throw new Error("User not found");

  user.isSuspended = true;
  user.suspensionReason = payload.suspensionReason;
  await user.save();

  return user;
};

// Activate user back
const activeAccount = async (accountId: string) => {
  const user = await Accounts.findById(accountId);
  if (!user) throw new Error("User not found");

  user.isSuspended = false;
  user.suspensionReason = null;
  await user.save();

  return user;
};


export const AuthServices = {
  signup,
  verifySignupOtp,
  resendSignupOtp,
  completeProfile,
  login,
  verifyLoginOtp,
  resendLoginOtp,
  loginAdmin,
  refreshToken,
  changeUserRole,
  suspendAccount,
  activeAccount
};

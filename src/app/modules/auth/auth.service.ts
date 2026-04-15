/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { TLoginAuth, TUser } from "./auth.interface";
import AppError from "../../errors/AppError";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../../config";
import { createToken } from "./auth.utils";
import { User } from "./auth.model";
import bcrypt from "bcrypt";
import axios from "axios";
import { Tutor } from "../tutor/tutor.model";
import { generateSequentialId } from "../../utils/customIdGenerators/generateSequentialId";
import { Guardian } from "../guardian/guardian.model";
import { Staff } from "../staff/staff.model";
import { io } from "../../../server";
import Expo from "expo-server-sdk";
import { Notification } from "../notification/notification.model";

const signup = async (payload: Partial<TUser>) => {
  // Checking if user already exists
  const isUserExistsByEmail = await User.findOne({ email: payload.email });
  const isUserExistsByPhoneNumber = await User.findOne({
    phoneNumber: payload.phoneNumber,
  });

  if (isUserExistsByEmail) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User already exists with this email."
    );
  }
  if (isUserExistsByPhoneNumber) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User already exists with this phone number."
    );
  }

  // Generating 6-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  const payloadData = {
    ...payload,
    otp,
    otpExpireAt: new Date(Date.now() + 2 * 60 * 1000), // expires in 2 minutes
  };

  // Creating the user
  const result = await User.create(payloadData);

  // Sending OTP
  try {
    const message = `Dear User,
Your code is ${otp} (valid for 2 minutes).
Thank you for choosing Bright Tuition Care, where we connect students and tutors.
Helpline: 09617785588`;

    const smsUrl = `https://sms.mram.com.bd/smsapi?api_key=${config.sms_provider_api_key}&type=text&contacts=${result.phoneNumber}&senderid=${config.sms_sender_id}&msg=${encodeURIComponent(
      message
    )}`;

    await axios.get(smsUrl);
  } catch (error) {
    console.error("❌ Failed to send OTP SMS:", error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to send OTP SMS"
    );
  }

  // 6. Return created user (without OTP)
  const { otp: _, otpExpireAt: __, ...userWithoutOtp } = result.toObject();
  return userWithoutOtp;
};

const expo = new Expo();

const verifyOtp = async (email: string, otp: string) => {
  // 1Find user
  const user = await User.findOne({ email });
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  if (user.isOtpVerified)
    throw new AppError(httpStatus.BAD_REQUEST, "User already verified.");
  if (!user.otp || user.otp !== otp)
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP.");
  if (user.otpExpireAt && user.otpExpireAt < new Date())
    throw new AppError(httpStatus.BAD_REQUEST, "OTP expired.");

  // 2Mark OTP as verified
  user.isOtpVerified = true;
  user.otp = null;
  user.otpExpireAt = null;
  await user.save();

  let roleBasedId = "";
  let isVerified = false;

  // 3 Handle Tutor role
  if (user.role === "tutor") {
    const tutor = await Tutor.create({
      userId: user._id,
      tutorId: await generateSequentialId("26", "tutorId"),
    });

    roleBasedId = tutor.tutorId;
    isVerified = tutor.isVerified || false;

    // Save notification in DB
    const notification = await Notification.create({
      to: [user._id],
      title: "Welcome to Bright Tuition Care!",
      message: "Complete your profile to get more job opportunities.",
      deliveryStatus: "sent",
    });

    // Prepare Expo push messages
    const messages: any[] = [];
    if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
      messages.push({
        to: user.expoPushToken,
        sound: "default",
        title: notification.title,
        body: notification.message,
      });
    }

    // Send push notifications
    let successCount = 0;
    let failCount = 0;
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        for (const ticket of ticketChunk) {
          if (ticket.status === "ok") successCount++;
          else failCount++;
        }
      } catch (error) {
        console.error("Error sending push notification:", error);
        failCount += chunk.length;
      }
    }

    // Update notification delivery status
    const overallStatus =
      successCount === 0 ? "failed" : failCount > 0 ? "partial" : "sent";
    notification.deliveryStatus = overallStatus;
    await notification.save();

    // Emit socket notification for in-app
    io.to(user._id.toString()).emit("new-notification", {
      notificationId: notification._id,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt,
    });
  }

  // 4 Handle Guardian role
  if (user.role === "guardian") {
    const guardian = await Guardian.create({
      userId: user._id,
      guardianId: await generateSequentialId("25", "guardianId"),
    });

    roleBasedId = guardian.guardianId;
    isVerified = guardian.isVerified || false;
  }

  // 8️⃣ JWT Payload
  const jwtPayload = {
    _id: user._id.toString(),
    userId: user._id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    profilePicture: user.profilePicture || "",
    createdAt: user.createdAt,
    roleBasedId,
    isVerified,
  };

  // 9️⃣ Tokens
  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profilePicture: user.profilePicture || "",
      createdAt: user.createdAt,
      roleBasedId,
      isVerified,
      isOtpVerified: user.isOtpVerified,
    },
  };
};

const resendOtp = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  if (user.isOtpVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "User already verified.");
  }

  // Generate new OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  user.otp = otp;
  user.otpExpireAt = new Date(Date.now() + 2 * 60 * 1000); // 2 min expiry
  await user.save();

  // Send OTP SMS again
  try {
    const message = `Your new verification code is ${otp}. It will expire in 2 minutes.`;

    const smsUrl = `https://sms.mram.com.bd/smsapi?api_key=${config.sms_provider_api_key}&type=text&contacts=${user.phoneNumber}&senderid=${config.sms_sender_id}&msg=${encodeURIComponent(
      message
    )}`;

    await axios.get(smsUrl);
  } catch (error) {
    console.error("❌ Failed to resend OTP:", error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to resend OTP SMS"
    );
  }

  return {
    message: "OTP resent successfully",
    email: user.email,
  };
};

// Login
const loginUser = async (payload: TLoginAuth) => {
  // 1️⃣ Check if user exists
  const user = await User.isUserExists(payload.email);

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No account found with this email address. Please sign up first."
    );
  }

  // 2️⃣ Check role mismatch
  if (user.role !== payload.role) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      `This email is not registered as a ${payload.role}. Please select the correct account type.`
    );
  }

  // 3️⃣ Role-based profile check
  let roleBasedId = "";
  let isVerified = false;

  if (user.role === "tutor") {
    const tutor = await Tutor.findOne({ userId: user._id });

    if (!tutor) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "No tutor account found for this email address. Please register as a tutor to continue."
      );
    }

    roleBasedId = tutor.tutorId;
    isVerified = tutor.isVerified || false;
  }

  if (user.role === "guardian") {
    const guardian = await Guardian.findOne({ userId: user._id });

    if (!guardian) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "No guardian account found for this email address. Please register as a guardian to continue."
      );
    }

    roleBasedId = guardian.guardianId;
    isVerified = guardian.isVerified || false;
  }

  if (user.role === "staff") {
    const staff = await Staff.findOne({ userId: user._id });

    if (!staff) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "No staff account found for this email address. Please register as a guardian to continue."
      );
    }

    roleBasedId = staff.staffId;
  }

  // 4️⃣ Deleted account check
  if (user.isDeleted) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Your account has been deleted. Please contact our support team if you need assistance or call us at 09617785588"
    );
  }

  // 5️⃣ Suspended account check
  if (user.isSuspended) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account has been deactivated. Please contact our support team for further assistance or call us at 09617785588"
    );
  }

  // 6️⃣ OTP verification check
  if (!user.isOtpVerified) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is not verified yet. Please verify your account to continue."
    );
  }

  // 7️⃣ Password validation
  const isPasswordMatched = await User.isPasswordMatched(
    payload.password,
    user.password
  );

  if (!isPasswordMatched) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Incorrect password. Please try again."
    );
  }

  // 8️⃣ JWT Payload
  const jwtPayload = {
    _id: user._id.toString(),
    userId: user.userId,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    profilePicture: user.profilePicture || "",
    createdAt: user.createdAt,
    roleBasedId,
    isVerified,
  };

  // 9️⃣ Tokens
  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profilePicture: user.profilePicture || "",
      createdAt: user.createdAt,
      roleBasedId,
      isVerified,
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

  const user = await User.isUserExists(email);
  let userCustomId = "";
  let isVerified;
  if (user?.role === "tutor") {
    const tutor = await Tutor.findOne({ userId: user._id });
    userCustomId = tutor?.tutorId;
    isVerified = tutor?.isVerified;
  }
  if (user?.role === "guardian") {
    const tutor = await Guardian.findOne({ userId: user._id });
    userCustomId = tutor?.guardianId;
    isVerified = tutor?.isVerified;
  }

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
    userId: user.userId,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    profilePicture: user.profilePicture || "",
    createdAt: user.createdAt,
    roleBasedId: userCustomId,
    isVerified,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  return {
    accessToken,
    user: {
      _id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profilePicture: user.profilePicture || "",
      createdAt: user.createdAt,
      roleBasedId: userCustomId,
      isVerified,
    },
  };
};

const forgetPassword = async (phoneNumber: string) => {
  const user = await User.findOne({ phoneNumber });

  if (!user || user?.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (!user.isOtpVerified) {
    throw new AppError(httpStatus.FORBIDDEN, "Your account is not verified.");
  }

  if (user.isSuspended) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is suspended. Please contact support."
    );
  }

  // Generate OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  user.resetOtp = otp;
  user.resetOtpExpireAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
  await user.save();

  const message = `Your password reset OTP is ${otp}. It will expire in 2 minutes.`;

  const smsUrl = `https://sms.mram.com.bd/smsapi?api_key=${config.sms_provider_api_key}&type=text&contacts=${user.phoneNumber}&senderid=${config.sms_sender_id}&msg=${encodeURIComponent(
    message
  )}`;

  await axios.get(smsUrl);

  return {};
};

const resendForgotPasswordOtp = async (phoneNumber: string) => {
  const user = await User.findOne({ phoneNumber });

  if (!user || user?.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (!user.isOtpVerified) {
    throw new AppError(httpStatus.FORBIDDEN, "Your account is not verified.");
  }

  if (user.isSuspended) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is suspended. Please contact support."
    );
  }

  // Generate New OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  user.resetOtp = otp;
  user.resetOtpExpireAt = new Date(Date.now() + 2 * 60 * 1000); // 2 min
  await user.save();

  const message = `Your password reset OTP is ${otp}. It will expire in 2 minutes.`;

  const smsUrl = `https://sms.mram.com.bd/smsapi?api_key=${config.sms_provider_api_key
    }&type=text&contacts=${user.phoneNumber
    }&senderid=${config.sms_sender_id}&msg=${encodeURIComponent(message)}`;

  await axios.get(smsUrl);

  return {};
};

const verifyResetOtp = async (phoneNumber: string, otp: string) => {
  const user = await User.findOne({ phoneNumber });

  if (!user || user?.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (!user.resetOtp || user.resetOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  if (user.resetOtpExpireAt! < new Date()) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP expired");
  }

  user.isResetOtpVerified = true;
  user.resetOtp = null;
  user.resetOtpExpireAt = null;
  await user.save();

  return {};
};

const resetPassword = async (payload: {
  phoneNumber: string;
  newPassword: string;
}) => {
  const user = await User.findOne({ phoneNumber: payload.phoneNumber });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (!user.isOtpVerified) {
    throw new AppError(httpStatus.FORBIDDEN, "Your account is not verified.");
  }

  if (user.isSuspended) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is suspended. Please contact support."
    );
  }

  if (!user.isResetOtpVerified) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "OTP not verified. Please verify OTP before resetting password."
    );
  }

  const newHashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_round)
  );

  await User.findOneAndUpdate(
    { phoneNumber: payload.phoneNumber },
    {
      password: newHashedPassword,
      passwordChangedAt: new Date(),
      isResetOtpVerified: false,
    }
  );

  return {};
};

const changePassword = async (
  userId: string,
  payload: { currentPassword: string; newPassword: string }
) => {
  const user = await User.findById(userId).select("+password");

  // Checking if the user exists
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  // Check if the current password is correct
  const isPasswordMatched = await bcrypt.compare(
    payload.currentPassword,
    user.password
  );
  if (!isPasswordMatched) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Current password is incorrect!"
    );
  }

  // Hash the new password
  const newHashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_round)
  );
  await User.findByIdAndUpdate(userId, {
    password: newHashedPassword,
  });
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

const addStaff = async (payload: any) => {
  const {
    name,
    email,
    phoneNumber,
    gender,
    city,
    area,
    password,
    pagesAssigned,
    jobRole,
  } = payload;

  const isUserExistsByEmail = await User.findOne({ email });
  if (isUserExistsByEmail) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User already exists with this email"
    );
  }

  const isUserExistsByPhone = await User.findOne({ phoneNumber });
  if (isUserExistsByPhone) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User already exists with this phone number"
    );
  }

  // Helper to normalize raw generated id into desired format
  const normalizeGeneratedId = (rawId: string, prefix: string) => {
    if (!rawId.startsWith(prefix)) return rawId;
    const suffix = rawId.slice(prefix.length);
    const numeric = parseInt(suffix, 10);
    const normalizedSuffix =
      numeric >= 100 ? numeric.toString() : numeric.toString().padStart(2, "0");
    return `${prefix}${normalizedSuffix}`;
  };

  const prefix = "25";
  let staffId: string | null = null;
  const maxAttempts = 10;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const raw = await generateSequentialId(prefix, "staffId");
    const candidate = normalizeGeneratedId(raw, prefix);

    const exists = await Staff.findOne({ staffId: candidate });
    if (!exists) {
      staffId = candidate;
      break;
    }

    console.warn(
      `staffId collision on attempt ${attempt}: ${candidate} exists (raw ${raw}). Retrying...`
    );
  }

  if (!staffId) {
    // failed to produce unique id in attempts
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Unable to generate unique staffId, try again later"
    );
  }

  const user = await User.create({
    name,
    email,
    phoneNumber,
    gender,
    city,
    area,
    password,
    role: "staff",
    isOtpVerified: true,
    otp: null,
    otpExpireAt: null,
  });

  const staff = await Staff.create({
    userId: user._id,
    staffId,
    pagesAssigned: pagesAssigned || [],
    jobRole,
  });

  return { user, staff };
};

export const AuthServices = {
  signup,
  verifyOtp,
  resendOtp,
  loginUser,
  refreshToken,
  forgetPassword,
  verifyResetOtp,
  resendForgotPasswordOtp,
  resetPassword,
  changePassword,
  changeUserRole,
  addStaff,
};

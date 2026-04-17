"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServices = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../../config"));
const accounts_utils_1 = require("./accounts.utils");
const accounts_model_1 = require("./accounts.model");
const axios_1 = __importDefault(require("axios"));
const sendEmail_1 = require("../../utils/sendEmail");
const user_model_1 = require("../users/user.model");
const generateOtp_1 = require("../../utils/generateOtp");
const astrologer_model_1 = require("../astrologer/astrologer.model");
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const signup = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Validating for admin registration
    if (payload.role === "admin") {
        const admin = yield accounts_model_1.Accounts.findOne({ role: "admin" });
        if (admin) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "Something has been wrong. Please avoid registering again.");
        }
    }
    // Validate input
    if (!payload.email && !payload.phoneNumber) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Either email or phone number is required");
    }
    // Check if user already exists in Auth collection
    if (payload.email) {
        const existingUser = yield accounts_model_1.Accounts.findOne({ email: payload.email });
        if (existingUser) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "User already exists with this email");
        }
    }
    if (payload.phoneNumber) {
        const existingUser = yield accounts_model_1.Accounts.findOne({ phoneNumber: payload.phoneNumber });
        if (existingUser) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "User already exists with this phone number");
        }
    }
    // Generate 6-digit OTP
    const otp = (0, generateOtp_1.generateOtp)();
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
            const smsUrl = `https://smsapi?api_key=${config_1.default.sms_provider_api_key}&type=text&contacts=${payload.phoneNumber}&senderid=${config_1.default.sms_sender_id}&msg=${encodeURIComponent(message)}`;
            yield axios_1.default.get(smsUrl);
        }
        catch (error) {
            console.error("❌ Failed to send OTP SMS:", error);
            throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to send OTP SMS");
        }
    }
    else if (payload.email) {
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
        yield (0, sendEmail_1.sendEmail)(payload.email, subject, htmlBody);
    }
    yield accounts_model_1.Accounts.create(signupPayload);
    return {};
});
const verifySignupOtp = (emailOrPhone, otp) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Find account by email or phone number
    const account = yield accounts_model_1.Accounts.findOne({
        $or: [
            { email: emailOrPhone },
            { phoneNumber: emailOrPhone }
        ]
    });
    if (!account) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Account not found.");
    }
    if (account.isOtpVerified) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "OTP is already verified.");
    }
    if (!account.otp || account.otp !== otp) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid OTP.");
    }
    if (account.otpExpireAt && account.otpExpireAt < new Date()) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "OTP has expired.");
    }
    // 2. Mark OTP as verified
    account.isOtpVerified = true;
    account.otp = null;
    account.otpExpireAt = null;
    yield account.save();
    // 3. Create role-specific profile if not exists
    if (account.role === "user") {
        const existingUser = yield user_model_1.User.findOne({ accountId: account._id });
        if (!existingUser) {
            yield user_model_1.User.create({
                accountId: account._id,
            });
        }
    }
    if (account.role === "astrologer") {
        const existingAstrologer = yield astrologer_model_1.Astrologer.findOne({ accountId: account._id });
        if (!existingAstrologer) {
            yield astrologer_model_1.Astrologer.create({
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
    const accessToken = (0, accounts_utils_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
    const refreshToken = (0, accounts_utils_1.createToken)(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expires_in);
    const user = yield user_model_1.User.findOne({ accountId: account._id });
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
});
const resendSignupOtp = (emailOrPhone) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Find account by email or phone number
    const account = yield accounts_model_1.Accounts.findOne({
        $or: [
            { email: emailOrPhone },
            { phoneNumber: emailOrPhone }
        ]
    });
    if (!account) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Account not found.");
    }
    if (account.isOtpVerified) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Account already verified.");
    }
    // 2. Generate new 6-digit OTP
    const otp = (0, generateOtp_1.generateOtp)();
    // 3. Update account with new OTP
    account.otp = otp;
    account.otpExpireAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes expiry
    yield account.save();
    // 4. Send OTP via appropriate channel
    if (account.phoneNumber) {
        // Send via SMS
        try {
            const message = `Your new verification code for Astrotitan is ${otp}. This code will expire in 2 minutes.`;
            const smsUrl = `https://sms.mram.com.bd/smsapi?api_key=${config_1.default.sms_provider_api_key}&type=text&contacts=${account.phoneNumber}&senderid=${config_1.default.sms_sender_id}&msg=${encodeURIComponent(message)}`;
            yield axios_1.default.get(smsUrl);
        }
        catch (error) {
            console.error("❌ Failed to resend OTP via SMS:", error);
            throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to resend OTP. Please try again.");
        }
    }
    else if (account.email) {
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
            yield (0, sendEmail_1.sendEmail)(account.email, subject, htmlBody);
        }
        catch (error) {
            console.error("❌ Failed to resend OTP via Email:", error);
            throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to resend OTP. Please try again.");
        }
    }
    return {
        success: true,
        message: "OTP resent successfully",
        identifier: account.email || account.phoneNumber,
    };
});
const completeProfile = (accountId, payload, files) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // Upload profile picture
    let profilePictureUrl = "";
    if ((_a = files === null || files === void 0 ? void 0 : files.profilePicture) === null || _a === void 0 ? void 0 : _a[0]) {
        const uploaded = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(files.profilePicture[0].originalname, files.profilePicture[0].path);
        profilePictureUrl = uploaded.secure_url;
    }
    // Upload identity front
    let frontSideUrl = "";
    if ((_b = files === null || files === void 0 ? void 0 : files.identityFront) === null || _b === void 0 ? void 0 : _b[0]) {
        const uploaded = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(files.identityFront[0].originalname, files.identityFront[0].path);
        frontSideUrl = uploaded.secure_url;
    }
    // Upload identity back
    let backSideUrl = "";
    if ((_c = files === null || files === void 0 ? void 0 : files.identityBack) === null || _c === void 0 ? void 0 : _c[0]) {
        const uploaded = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(files.identityBack[0].originalname, files.identityBack[0].path);
        backSideUrl = uploaded.secure_url;
    }
    // Checking if account exists
    const account = yield accounts_model_1.Accounts.findById(accountId);
    if (!account) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Account not found.");
    }
    // Checking if account is verified
    if (!account.isOtpVerified) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Please verify your account first.");
    }
    // Parsing array fields
    const parseArrayField = (field) => {
        if (!field)
            return [];
        if (Array.isArray(field))
            return field;
        if (typeof field === 'string') {
            try {
                const parsed = JSON.parse(field);
                return Array.isArray(parsed) ? parsed : [field];
            }
            catch (e) {
                return [field];
            }
        }
        return [];
    };
    // Payload
    const cleanedPayload = Object.assign(Object.assign({}, payload), { consultLanguages: parseArrayField(payload.consultLanguages), areaOfPractice: parseArrayField(payload.areaOfPractice) });
    let profile;
    // Role-based profile creation
    if (account.role === "user") {
        profile = yield user_model_1.User.findOneAndUpdate({ accountId: accountId }, Object.assign(Object.assign({}, cleanedPayload), { isProfileCompleted: true }), { new: true, upsert: true });
    }
    else if (account.role === "astrologer") {
        // Astrologer data
        const astrologerData = Object.assign({ accountId: account._id, identity: {
                identityType: payload.identityType,
                frontSide: frontSideUrl || payload.frontSide,
                backSide: backSideUrl || payload.backSide,
            }, profilePicture: profilePictureUrl || payload.profilePicture || "", isProfileCompleted: true }, cleanedPayload);
        // Validating identity for astrologer
        if (!astrologerData.identity.identityType) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Identity type is required for astrologer");
        }
        if (!astrologerData.identity.frontSide) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Front side of identity document is required");
        }
        if (!astrologerData.identity.backSide) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Back side of identity document is required");
        }
        profile = yield astrologer_model_1.Astrologer.findOneAndUpdate({ accountId: accountId }, astrologerData, { new: true, upsert: true });
    }
    yield accounts_model_1.Accounts.findByIdAndUpdate(accountId, {
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
});
// Login
const login = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate input
    if (!payload.email && !payload.phoneNumber) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Either email or phone number is required");
    }
    // Build query dynamically (remove undefined/null values)
    const query = {
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
    const account = yield accounts_model_1.Accounts.findOne(query);
    if (!account) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "No account found. Please sign up first.");
    }
    // Check role mismatch
    if (account.role !== payload.role) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, `This account is registered as a ${account.role}. Please select the correct account type.`);
    }
    // Check if account is deleted or suspended
    if (account.isDeleted) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Your account has been deleted. Please contact support.");
    }
    if (account.isSuspended) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Your account has been suspended. Please contact support.");
    }
    // Check if OTP is verified during signup
    if (!account.isOtpVerified) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Your account is not verified. Please complete your signup verification first.");
    }
    // Generate 4-digit OTP for login
    const loginOtp = (0, generateOtp_1.generateOtp)();
    // Save login OTP to account
    account.loginOtp = loginOtp;
    account.loginOtpExpireAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes expiry
    yield account.save();
    // Send OTP via appropriate channel
    if (payload.phoneNumber) {
        // Send via SMS
        try {
            const message = `Your Astrotitan login OTP is ${loginOtp}. Valid for 2 minutes. Do not share this code with anyone.`;
            const smsUrl = `https://sms.mram.com.bd/smsapi?api_key=${config_1.default.sms_provider_api_key}&type=text&contacts=${payload.phoneNumber}&senderid=${config_1.default.sms_sender_id}&msg=${encodeURIComponent(message)}`;
            yield axios_1.default.get(smsUrl);
        }
        catch (error) {
            console.error("❌ Failed to send login OTP via SMS:", error);
            throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to send OTP. Please try again.");
        }
    }
    else if (payload.email) {
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
            yield (0, sendEmail_1.sendEmail)(payload.email, subject, htmlBody);
        }
        catch (error) {
            console.error("❌ Failed to send login OTP via Email:", error);
            throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to send OTP. Please try again.");
        }
    }
    return {
        success: true,
        message: "Login OTP sent successfully",
        identifier: payload.email || payload.phoneNumber,
        role: account.role,
    };
});
// Step 2: Verify OTP and login
const verifyLoginOtp = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Find account by email or phone
    const account = yield accounts_model_1.Accounts.findOne({
        $or: [
            { email: payload.emailOrPhone },
            { phoneNumber: payload.emailOrPhone }
        ]
    });
    if (!account) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Account not found. Please sign up first.");
    }
    // Verify OTP
    if (!account.loginOtp || account.loginOtp !== payload.otp) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid OTP.");
    }
    if (account.loginOtpExpireAt && account.loginOtpExpireAt < new Date()) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "OTP has expired. Please request a new one.");
    }
    // Clear login OTP after successful verification
    account.loginOtp = null;
    account.loginOtpExpireAt = null;
    yield account.save();
    // Get role-based profile
    let roleBasedId = "";
    if (account.role === "user") {
        const userProfile = yield accounts_model_1.Accounts.findOne({ accountId: account._id });
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
    const accessToken = (0, accounts_utils_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
    const refreshToken = (0, accounts_utils_1.createToken)(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expires_in);
    const user = yield user_model_1.User.findOne({ accountId: account._id });
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
            isProfileCompleted: (user === null || user === void 0 ? void 0 : user.isProfileCompleted) || false
        },
    };
});
// Resend login OTP
const resendLoginOtp = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Find account
    const account = yield accounts_model_1.Accounts.findOne({
        $or: [
            { email: payload.emailOrPhone },
            { phoneNumber: payload.emailOrPhone }
        ]
    });
    if (!account) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Account not found.");
    }
    // Check if account is active
    if (account.isDeleted || account.isSuspended) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Your account is not active. Please contact support.");
    }
    // Check if account is verified
    if (!account.isOtpVerified) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Your account is not verified. Please complete signup verification first.");
    }
    // Generate new 6-digit OTP
    const loginOtp = (0, generateOtp_1.generateOtp)();
    // Update account with new OTP (2 minutes expiry)
    account.loginOtp = loginOtp;
    account.loginOtpExpireAt = new Date(Date.now() + 2 * 60 * 1000);
    yield account.save();
    // Send OTP via appropriate channel
    if (account.phoneNumber) {
        // Send via SMS
        try {
            const message = `Your Astrotitan login OTP is ${loginOtp}. This code is valid for 2 minutes. Do not share this code with anyone.`;
            const smsUrl = `https://sms.mram.com.bd/smsapi?api_key=${config_1.default.sms_provider_api_key}&type=text&contacts=${account.phoneNumber}&senderid=${config_1.default.sms_sender_id}&msg=${encodeURIComponent(message)}`;
            yield axios_1.default.get(smsUrl);
        }
        catch (error) {
            console.error("❌ Failed to resend login OTP via SMS:", error);
            throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to resend OTP. Please try again.");
        }
    }
    else if (account.email) {
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
            yield (0, sendEmail_1.sendEmail)(account.email, subject, htmlBody);
        }
        catch (error) {
            console.error("❌ Failed to resend login OTP via Email:", error);
            throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to resend OTP. Please try again.");
        }
    }
    return {
        success: true,
        message: "Login OTP resent successfully",
        identifier: account.email || account.phoneNumber,
    };
});
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    // Checking if there is any token sent from the client or not.
    if (!token) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized to proceed!");
    }
    // Checking if the token is valid or not.
    const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt_refresh_secret);
    const { email } = decoded;
    const user = yield accounts_model_1.Accounts.isUserExists(email);
    yield accounts_model_1.Accounts.findOneAndUpdate({ _id: user._id }, { $set: { isOtpVerified: true } });
    // Checking if the user exists or not
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found!");
    }
    // Checking if the user already deleted or not
    const isUserDeleted = user === null || user === void 0 ? void 0 : user.isDeleted;
    if (isUserDeleted) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User does not exists.");
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
    const accessToken = (0, accounts_utils_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
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
});
// Change user role (For admin)
const changeUserRole = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(payload === null || payload === void 0 ? void 0 : payload.userId);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const result = yield user_model_1.User.findByIdAndUpdate(payload === null || payload === void 0 ? void 0 : payload.userId, { role: payload === null || payload === void 0 ? void 0 : payload.role }, {
        new: true,
        runValidators: true,
    });
    return result;
});
// Suspend user
const suspendAccount = (accountId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield accounts_model_1.Accounts.findById(accountId);
    if (!user)
        throw new Error("User not found");
    user.isSuspended = true;
    user.suspensionReason = payload.suspensionReason;
    yield user.save();
    return user;
});
// Activate user back
const activeAccount = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield accounts_model_1.Accounts.findById(accountId);
    if (!user)
        throw new Error("User not found");
    user.isSuspended = false;
    user.suspensionReason = null;
    yield user.save();
    return user;
});
exports.AuthServices = {
    signup,
    verifySignupOtp,
    resendSignupOtp,
    completeProfile,
    login,
    verifyLoginOtp,
    resendLoginOtp,
    refreshToken,
    changeUserRole,
    suspendAccount,
    activeAccount
};

/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { AuthServices } from "./accounts.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import config from "../../config";

// User Signup (Request OTP for registration)
const signup = catchAsync(async (req, res) => {
  const result = await AuthServices.signup(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP sent to your email/phone. Please verify to complete signup.",
    data: result,
  });
});

// User Verify OTP for Signup
const verifySignupOtp = catchAsync(async (req, res) => {
  const { emailOrPhone, otp } = req.body;
  console.log(req.body);

  const result = await AuthServices.verifySignupOtp(emailOrPhone, otp);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Signup OTP verified successfully. Please complete your profile.",
    data: result,
  });
});

// Resend Signup OTP
const resendSignupOtp = catchAsync(async (req, res) => {
  const { emailOrPhone } = req.body;

  const result = await AuthServices.resendSignupOtp(emailOrPhone);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Signup OTP resent successfully.",
    data: result,
  });
});

const completeProfile = catchAsync(async (req, res) => {
  const { _id } = req.user;
  const result = await AuthServices.completeProfile(_id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile completed successfully",
    data: result,
  });
});

// Request Login OTP
const login = catchAsync(async (req, res) => {
  const { email, phoneNumber, role } = req.body;

  const result = await AuthServices.login({ email, phoneNumber, role });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Login OTP sent to your email/phone.",
    data: result,
  });
});

// Verify Login OTP and Login
const verifyLoginOtp = catchAsync(async (req, res) => {
  const { emailOrPhone, otp } = req.body;

  const result = await AuthServices.verifyLoginOtp({ emailOrPhone, otp });

  const { refreshToken } = result;

  // Set refresh token in cookie
  res.cookie("refreshToken", refreshToken, {
    secure: config.node_env === "production",
    httpOnly: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully.",
    data: result,
  });
});

// Resend Login OTP
const resendLoginOtp = catchAsync(async (req, res) => {
  const { emailOrPhone } = req.body;

  const result = await AuthServices.resendLoginOtp({ emailOrPhone });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Login OTP resent successfully.",
    data: result,
  });
});

// Refresh Token
const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  const result = await AuthServices.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New access token generated successfully.",
    data: result,
  });
});

// Change User Role (For admin only)
const changeUserRole = catchAsync(async (req, res) => {
  const result = await AuthServices.changeUserRole(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User role updated successfully.",
    data: result,
  });
});

export const AuthControllers = {
  signup,
  verifySignupOtp,
  resendSignupOtp,
  completeProfile,
  login,
  verifyLoginOtp,
  resendLoginOtp,
  refreshToken,
  changeUserRole,
};
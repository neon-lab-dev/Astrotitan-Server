/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { AuthServices } from "./auth.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import config from "../../config";

// User Signup
const signup = catchAsync(async (req, res) => {
  const result = await AuthServices.signup(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "We've send OTP to your email. Please verify.",
    data: result,
  });
});

// User Verify OTP
const verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  const result = await AuthServices.verifyOtp(email, otp);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP verified successfully.",
    data: result,
  });
});

// User Login
const loginUser = catchAsync(async (req, res) => {
  const result = await AuthServices.loginUser(req.body);

  const { refreshToken } = result;

  res.cookie("refreshToken", refreshToken, {
    secure: config.node_env === "production",
    httpOnly: true,
    sameSite: "strict",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully.",
    data: result,
  });
});

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

const forgetPassword = catchAsync(async (req, res) => {
  const phoneNumber = req.body.phoneNumber;
  const result = await AuthServices.forgetPassword(phoneNumber);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP sent to your phone number.",
    data: result,
  });
});

const resendForgotPasswordOtp = catchAsync(async (req, res) => {
  const { phoneNumber } = req.body;
  const result = await AuthServices.resendForgotPasswordOtp(phoneNumber);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP resent successfully.",
    data: result,
  });
});

// User Verify OTP
const verifyResetOtp = catchAsync(async (req, res) => {
  const { phoneNumber, otp } = req.body;

  const result = await AuthServices.verifyResetOtp(phoneNumber, otp);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP verified successfully.",
    data: result,
  });
});

const resendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;

  const result = await AuthServices.resendOtp(email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP resent successfully",
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const result = await AuthServices.resetPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully. You can login now.",
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const userId = req.user._id;
  await AuthServices.changePassword(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password changed successfully!",
    data: null,
  });
});

// Change User Role (For admin)
const changeUserRole = catchAsync(async (req, res) => {
  const result = await AuthServices.changeUserRole(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User role updated successfully.",
    data: result,
  });
});

// Staff Signup
const addStaff = catchAsync(async (req, res) => {
  const result = await AuthServices.addStaff(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Staff added successfully.",
    data: result,
  });
});

export const AuthControllers = {
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

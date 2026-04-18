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
exports.AuthControllers = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const accounts_service_1 = require("./accounts.service");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const config_1 = __importDefault(require("../../config"));
// User Signup (Request OTP for registration)
const signup = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield accounts_service_1.AuthServices.signup(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "OTP sent to your email/phone. Please verify to complete signup.",
        data: result,
    });
}));
// User Verify OTP for Signup
const verifySignupOtp = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { emailOrPhone, otp } = req.body;
    const result = yield accounts_service_1.AuthServices.verifySignupOtp(emailOrPhone, otp);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Signup OTP verified successfully. Please complete your profile.",
        data: result,
    });
}));
// Resend Signup OTP
const resendSignupOtp = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { emailOrPhone } = req.body;
    const result = yield accounts_service_1.AuthServices.resendSignupOtp(emailOrPhone);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Signup OTP resent successfully.",
        data: result,
    });
}));
const completeProfile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { _id } = req.user;
    const files = req.files;
    const result = yield accounts_service_1.AuthServices.completeProfile(_id, req.body, files);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Profile completed successfully",
        data: result,
    });
}));
// Request Login OTP
const login = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, phoneNumber, role } = req.body;
    const result = yield accounts_service_1.AuthServices.login({ email, phoneNumber, role });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Login OTP sent to your email/phone.",
        data: result,
    });
}));
// Verify Login OTP and Login
const verifyLoginOtp = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { emailOrPhone, otp } = req.body;
    const result = yield accounts_service_1.AuthServices.verifyLoginOtp({ emailOrPhone, otp });
    const { refreshToken } = result;
    // Set refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
        secure: config_1.default.node_env === "production",
        httpOnly: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Logged in successfully.",
        data: result,
    });
}));
// Admin Login
const loginAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield accounts_service_1.AuthServices.loginAdmin(req.body);
    const { refreshToken } = result;
    res.cookie("refreshToken", refreshToken, {
        secure: config_1.default.node_env === "production",
        httpOnly: true,
        sameSite: "strict",
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Logged in successfully.",
        data: result,
    });
}));
// Resend Login OTP
const resendLoginOtp = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { emailOrPhone } = req.body;
    const result = yield accounts_service_1.AuthServices.resendLoginOtp({ emailOrPhone });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Login OTP resent successfully.",
        data: result,
    });
}));
// Refresh Token
const refreshToken = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { refreshToken } = req.cookies;
    const result = yield accounts_service_1.AuthServices.refreshToken(refreshToken);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "New access token generated successfully.",
        data: result,
    });
}));
// Change User Role (For admin only)
const changeUserRole = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield accounts_service_1.AuthServices.changeUserRole(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User role updated successfully.",
        data: result,
    });
}));
// suspend user
const suspendAccount = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { accountId } = req.params;
    const result = yield accounts_service_1.AuthServices.suspendAccount(accountId, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        message: "User suspended successfully",
        statusCode: http_status_1.default.OK,
        data: result,
    });
}));
// activate user
const activeAccount = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { accountId } = req.params;
    const result = yield accounts_service_1.AuthServices.activeAccount(accountId);
    (0, sendResponse_1.default)(res, {
        success: true,
        message: "User activated successfully",
        statusCode: http_status_1.default.OK,
        data: result,
    });
}));
exports.AuthControllers = {
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

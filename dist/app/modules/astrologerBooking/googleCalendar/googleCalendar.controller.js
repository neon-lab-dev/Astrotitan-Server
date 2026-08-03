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
exports.GoogleCalendarController = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const googleCalendar_service_1 = __importDefault(require("./googleCalendar.service"));
//Get Google Calendar OAuth URL for astrologer to connect
const getAuthUrl = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologerId = req.user._id;
    const result = yield googleCalendar_service_1.default.getAuthUrl(astrologerId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Google Calendar auth URL generated successfully",
        data: result,
    });
}));
//Handle Google OAuth callback
const handleCallback = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code, state, error } = req.query;
    // Check for errors from Google
    if (error) {
        console.error('❌ Google OAuth error:', error);
        return res.redirect(`${process.env.FRONTEND_URL}/astrologer/bookings?error=${error}`);
    }
    // Validate required params
    // if (!code) {
    //   console.error('❌ Missing authorization code');
    //   return res.redirect(`${process.env.FRONTEND_URL}/astrologer/bookings?error=missing_code`);
    // }
    // if (!state) {
    //   console.error('❌ Missing state parameter (astrologer ID)');
    //   return res.redirect(`${process.env.FRONTEND_URL}/astrologer/bookings?error=missing_state`);
    // }
    // state is the astrologer ID
    const astrologerId = state;
    // if (!astrologerId) {
    //   console.error('❌ Invalid astrologer ID in state:', astrologerId);
    //   return res.redirect(`${process.env.FRONTEND_URL}/astrologer/bookings?error=invalid_astrologer`);
    // }
    try {
        const result = yield googleCalendar_service_1.default.handleOAuthCallback(code, astrologerId);
        if (result.success) {
            return res.redirect(`${process.env.FRONTEND_URL}`);
        }
        else {
            return res.redirect(`${process.env.FRONTEND_URL}/astrologer/bookings?error=connection_failed`);
        }
    }
    catch (error) {
        return {
            success: false,
            message: error.message,
        };
    }
}));
//Get astrologer's calendar connection status
const getConnectionStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accountId = req.user._id;
    const result = yield googleCalendar_service_1.default.getConnectionStatus(accountId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Calendar connection status fetched successfully",
        data: result,
    });
}));
//Disconnect Google Calendar
const disconnectCalendar = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologerId = req.user._id;
    const result = yield googleCalendar_service_1.default.disconnectCalendar(astrologerId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Google Calendar disconnected successfully",
        data: result,
    });
}));
exports.GoogleCalendarController = {
    getAuthUrl,
    handleCallback,
    getConnectionStatus,
    disconnectCalendar,
};

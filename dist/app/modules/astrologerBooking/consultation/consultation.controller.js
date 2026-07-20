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
exports.ConsultationControllers = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const consultation_service_1 = require("./consultation.service");
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const twilio_1 = require("../../../utils/twilio");
/* Request Consultation */
const requestConsultation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const result = yield consultation_service_1.ConsultationServices.requestConsultation(userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Your consultation request has been sent successfully. Please wait for astrologer to accept your request.",
        data: result,
    });
}));
/* Get My Consultation Requests - User */
const getMyConsultationRequests = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { status, skip = "0", limit = "10" } = req.query;
    const filters = {
        status: status,
    };
    const result = yield consultation_service_1.ConsultationServices.getMyConsultationRequests(userId, filters, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Your consultation requests fetched successfully",
        data: result,
    });
}));
/* Get My Consultation Bookings - Astrologer */
const getMyConsultationBookings = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologerId = req.user._id;
    const { status, method, skip = "0", limit = "10" } = req.query;
    const filters = {
        status: status,
        method: method,
    };
    const result = yield consultation_service_1.ConsultationServices.getMyConsultationBookings(astrologerId, filters, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Consultation bookings fetched successfully",
        data: result,
    });
}));
/* Change Consultation Status - Astrologer */
const changeConsultationStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accountId = req.user._id;
    const { consultationId } = req.params;
    const { status } = req.body;
    const result = yield consultation_service_1.ConsultationServices.changeConsultationStatus(consultationId, accountId, { status });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Consultation ${status} successfully`,
        data: result,
    });
}));
/* Get Single Consultation */
const getSingleConsultation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { consultationId } = req.params;
    const result = yield consultation_service_1.ConsultationServices.getSingleConsultation(consultationId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Consultation fetched successfully",
        data: result,
    });
}));
const endConsultationSession = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accountId = req.user._id;
    const { consultationId } = req.params;
    const result = yield consultation_service_1.ConsultationServices.endConsultationSession(consultationId, accountId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Session ended successfully!",
        data: result,
    });
}));
/* Add Review for Consultation */
const addReview = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { consultationId } = req.params;
    const { review, rating } = req.body;
    const result = yield consultation_service_1.ConsultationServices.addReview(consultationId, userId, { review, rating });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Review added successfully",
        data: result.data,
    });
}));
// Start a call
const startCall = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { consultationId } = req.body;
    const result = yield consultation_service_1.ConsultationServices.startCall(consultationId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Call initiated successfully',
        data: result,
    });
}));
// Accept a call
const acceptCall = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { consultationId } = req.body;
    const result = yield consultation_service_1.ConsultationServices.acceptCall(consultationId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Call accepted successfully',
        data: result,
    });
}));
// Reject a call
const rejectCall = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { consultationId } = req.body;
    const result = yield consultation_service_1.ConsultationServices.rejectCall(consultationId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Call rejected successfully',
        data: result,
    });
}));
// End a call
const endCall = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { consultationId } = req.body;
    const result = yield consultation_service_1.ConsultationServices.endCall(consultationId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Call ended successfully',
        data: result,
    });
}));
// Get call token
const getCallToken = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { consultationId } = req.params;
    const result = yield consultation_service_1.ConsultationServices.getCallToken(consultationId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Call token generated successfully',
        data: result,
    });
}));
// Get call status
const getCallStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { consultationId } = req.params;
    const result = yield consultation_service_1.ConsultationServices.getCallStatus(consultationId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Call status fetched successfully',
        data: result,
    });
}));
// Add a test endpoint in your backend
const testTwilioCredentials = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Test generating a token
        const token = (0, twilio_1.generateTwilioAccessToken)('test-user', 'test-room');
        // Decode token to check
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: "Twilio credentials valid",
            data: {
                tokenPreview: token.substring(0, 50) + '...',
                payload: payload,
                hasVideoGrant: !!((_a = payload.grants) === null || _a === void 0 ? void 0 : _a.video),
                identity: (_b = payload.grants) === null || _b === void 0 ? void 0 : _b.identity,
            },
        });
    }
    catch (error) {
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message || "Twilio credentials invalid",
            data: null,
        });
    }
}));
exports.ConsultationControllers = {
    requestConsultation,
    getMyConsultationBookings,
    getMyConsultationRequests,
    changeConsultationStatus,
    getSingleConsultation,
    endConsultationSession,
    addReview,
    startCall,
    endCall,
    acceptCall,
    rejectCall,
    getCallToken,
    getCallStatus,
    testTwilioCredentials
};

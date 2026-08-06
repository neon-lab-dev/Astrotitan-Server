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
    const { status, date, method, skip = "0", limit = "10" } = req.query;
    const filters = {
        status: status,
        method: method,
        date: date,
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
/* Schedule Meeting - Astrologer */
const scheduleMeeting = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accountId = req.user._id;
    const { consultationId } = req.params;
    const result = yield consultation_service_1.ConsultationServices.scheduleMeeting(consultationId, accountId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Meeting scheduled successfully",
        data: result,
    });
}));
/* Send Reschedule Request - User */
const sendRescheduleRequest = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { consultationId } = req.params;
    const { requestedTime, reason } = req.body;
    const result = yield consultation_service_1.ConsultationServices.sendRescheduleRequest(consultationId, userId, { requestedTime: new Date(requestedTime), reason });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Reschedule request sent successfully",
        data: result,
    });
}));
/* Handle Reschedule Request - Astrologer */
const rescheduleMeeting = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { consultationId } = req.params;
    const { action } = req.body;
    const result = yield consultation_service_1.ConsultationServices.rescheduleMeeting(consultationId, userId, { action });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Reschedule request ${action}ed successfully`,
        data: result,
    });
}));
const addRecommendations = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accountId = req.user._id;
    const { consultationId } = req.params;
    const { recommendations } = req.body;
    if (!recommendations || !recommendations.trim()) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: "Recommendations content is required",
            data: null,
        });
    }
    const result = yield consultation_service_1.ConsultationServices.addRecommendations(consultationId, accountId, { recommendations: recommendations.trim() });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: result.message,
        data: result.data,
    });
}));
exports.ConsultationControllers = {
    requestConsultation,
    getMyConsultationBookings,
    getMyConsultationRequests,
    changeConsultationStatus,
    getSingleConsultation,
    endConsultationSession,
    addReview,
    scheduleMeeting,
    sendRescheduleRequest,
    rescheduleMeeting,
    addRecommendations,
};

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
const http_status_1 = __importDefault(require("http-status"));
const consultation_service_1 = require("./consultation.service");
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
// Request consultation
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
// Get my consultation requests - User
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
// Get my consultation bookings - Astrologer
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
// Change consultation status - Astrologer
const changeConsultationStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accountId = req.user._id;
    const { consultationId } = req.params;
    const { status } = req.body;
    const result = yield consultation_service_1.ConsultationServices.changeConsultationStatus(consultationId, accountId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Consultation ${status} successfully`,
        data: result,
    });
}));
// Get single consultation
const getSingleConsultation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accountId = req.user._id;
    const { consultationId } = req.params;
    const result = yield consultation_service_1.ConsultationServices.getSingleConsultation(consultationId, accountId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Consultation fetched successfully",
        data: result,
    });
}));
// Join consultation call - User/Astrologer
const joinConsultation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accountId = req.user._id;
    const { consultationId } = req.params;
    const result = yield consultation_service_1.ConsultationServices.joinConsultation(consultationId, accountId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Consultation call credentials generated successfully",
        data: result,
    });
}));
// Start consultation - Astrologer
const startConsultation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accountId = req.user._id;
    const { consultationId } = req.params;
    const result = yield consultation_service_1.ConsultationServices.startConsultation(consultationId, accountId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Consultation started successfully",
        data: result,
    });
}));
// End consultation session
const endConsultationSession = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accountId = req.user._id;
    const { consultationId } = req.params;
    const result = yield consultation_service_1.ConsultationServices.endConsultationSession(consultationId, accountId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Consultation ended successfully",
        data: result,
    });
}));
// Add review for consultation
const addReview = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { consultationId } = req.params;
    const { review, rating } = req.body;
    const result = yield consultation_service_1.ConsultationServices.addReview(consultationId, userId, {
        review,
        rating,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Review added successfully",
        data: result.data,
    });
}));
// Schedule consultation - Astrologer
const scheduleConsultation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accountId = req.user._id;
    const { consultationId } = req.params;
    const result = yield consultation_service_1.ConsultationServices.scheduleConsultation(consultationId, accountId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Consultation scheduled successfully",
        data: result,
    });
}));
// Send reschedule request - User
const sendRescheduleRequest = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { consultationId } = req.params;
    const { requestedTime, reason } = req.body;
    const result = yield consultation_service_1.ConsultationServices.sendRescheduleRequest(consultationId, userId, {
        requestedTime: new Date(requestedTime),
        reason,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Reschedule request sent successfully",
        data: result,
    });
}));
// Handle reschedule request - Astrologer
const rescheduleConsultation = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologerId = req.user._id;
    const { consultationId } = req.params;
    const { action } = req.body;
    const result = yield consultation_service_1.ConsultationServices.rescheduleConsultation(consultationId, astrologerId, { action });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Reschedule request ${action}ed successfully`,
        data: result,
    });
}));
// Add recommendations - Astrologer
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
    const result = yield consultation_service_1.ConsultationServices.addRecommendations(consultationId, accountId, {
        recommendations: recommendations.trim(),
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: result.message,
        data: result.data,
    });
}));
exports.ConsultationControllers = {
    requestConsultation,
    getMyConsultationRequests,
    getMyConsultationBookings,
    changeConsultationStatus,
    getSingleConsultation,
    scheduleConsultation,
    joinConsultation,
    startConsultation,
    endConsultationSession,
    addReview,
    sendRescheduleRequest,
    rescheduleConsultation,
    addRecommendations,
};

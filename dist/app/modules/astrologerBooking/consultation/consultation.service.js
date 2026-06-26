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
exports.ConsultationServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const consultation_model_1 = __importDefault(require("./consultation.model"));
const astrologer_model_1 = require("../../astrologer/astrologer.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const sendSingleNotification_1 = require("../../../utils/sendSingleNotification");
const infinitePaginate_1 = require("../../../utils/infinitePaginate");
const user_model_1 = require("../../users/user.model");
const requestConsultation = (accountId, // This is Account ID
payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists in Accounts
    const user = yield user_model_1.User.findOne({ accountId });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // Check if astrologer exists in Accounts
    const astrologer = yield astrologer_model_1.Astrologer.findById(payload.astrologer);
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // Check if there's already a pending consultation
    const existingConsultation = yield consultation_model_1.default.findOne({
        user: user === null || user === void 0 ? void 0 : user._id,
        astrologer: payload.astrologer,
        status: "pending",
    });
    if (existingConsultation) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "You already have a pending consultation request with this astrologer");
    }
    // Create consultation with Account IDs
    const consultation = yield consultation_model_1.default.create({
        user: user === null || user === void 0 ? void 0 : user._id,
        astrologer: payload.astrologer,
        method: payload.method,
        consultationFor: payload.consultationFor,
        requestMessage: payload.requestMessage,
        status: "pending",
    });
    // Populate with Account details
    const populatedConsultation = yield consultation_model_1.default.findById(consultation._id)
        .populate("user", "firstName lastName email profilePicture")
        .populate("astrologer", "firstName lastName displayName profilePicture");
    return populatedConsultation;
});
/* Get My Consultation Requests - User */
const getMyConsultationRequests = (accountId_1, ...args_1) => __awaiter(void 0, [accountId_1, ...args_1], void 0, function* (accountId, filters = {}, skip = 0, limit = 10) {
    // Find the actual User document using accountId
    const user = yield user_model_1.User.findOne({ accountId: accountId });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // Use the User's _id for the query
    const query = { user: user._id };
    if (filters.status && filters.status !== "all") {
        query.status = filters.status;
    }
    const result = yield (0, infinitePaginate_1.infinitePaginate)(consultation_model_1.default, query, skip, limit, [
        {
            path: "user",
            select: "firstName lastName fullName profilePicture accountId"
        },
        {
            path: "astrologer",
            select: "firstName lastName displayName profilePicture accountId"
        }
    ]);
    return result;
});
/* Get My Consultation Bookings - Astrologer */
const getMyConsultationBookings = (accountId_1, ...args_1) => __awaiter(void 0, [accountId_1, ...args_1], void 0, function* (accountId, filters = {}, skip = 0, limit = 10) {
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId });
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // Use Account ID directly - no need to find Astrologer
    const query = { astrologer: astrologer === null || astrologer === void 0 ? void 0 : astrologer._id };
    if (filters.status && filters.status !== "all") {
        query.status = filters.status;
    }
    const result = yield (0, infinitePaginate_1.infinitePaginate)(consultation_model_1.default, query, skip, limit, [
        {
            path: "user",
            select: "firstName lastName fullName email profilePicture accountId"
        },
        {
            path: "astrologer",
            select: "firstName lastName displayName profilePicture accountId"
        }
    ]);
    return result;
});
/* Change Consultation Status - Astrologer */
const changeConsultationStatus = (consultationId, accountId, // This is Account ID
payload) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId });
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // Find consultation using Account ID directly
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        astrologer: astrologer._id,
    });
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found or you are not authorized");
    }
    // Check if consultation is already handled
    if (consultation.status !== "pending") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `This consultation is already ${consultation.status}`);
    }
    // Store user ID before updating (for notification)
    const userId = consultation.user.accountId;
    // Update status
    const updateData = {
        status: payload.status,
    };
    if (payload.status === "accepted") {
        updateData.acceptedAt = new Date();
        updateData.startedAt = new Date();
    }
    if (payload.status === "declined") {
        updateData.declinedAt = new Date();
    }
    const updatedConsultation = yield consultation_model_1.default.findByIdAndUpdate(consultationId, updateData, { new: true })
        .populate("user", "firstName lastName email profilePicture")
        .populate("astrologer", "firstName lastName displayName profilePicture");
    // Send notification to user using stored userId
    // const statusMessage =
    //   payload.status === "accepted"
    //     ? "accepted your consultation request"
    //     : "declined your consultation request";
    yield (0, sendSingleNotification_1.sendSingleNotification)(userId, `Consultation ${payload.status === "accepted" ? "Accepted" : "Declined"}`, `Your consultation request has been ${payload.status} by the astrologer.`);
    return updatedConsultation;
});
/* Get Single Consultation */
const getSingleConsultation = (consultationId, accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId });
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    const user = yield user_model_1.User.findOne({ accountId });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        $or: [{ user: user === null || user === void 0 ? void 0 : user._id }, { astrologer: astrologer === null || astrologer === void 0 ? void 0 : astrologer._id }],
    })
        .populate("user")
        .populate("astrologer");
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found");
    }
    return consultation;
});
exports.ConsultationServices = {
    requestConsultation,
    getMyConsultationBookings,
    getMyConsultationRequests,
    changeConsultationStatus,
    getSingleConsultation,
};

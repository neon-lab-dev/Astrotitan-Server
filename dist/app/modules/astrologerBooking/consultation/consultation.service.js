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
    yield (0, sendSingleNotification_1.sendSingleNotification)(accountId, "Consultation Request Sent Successfully", `Your consultation request with ${astrologer === null || astrologer === void 0 ? void 0 : astrologer.displayName} has been sent successfully. You will be notified once they accept your request.`);
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
    if (filters.method && filters.method !== "all") {
        query.method = filters.method;
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
    var _a, _b;
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId });
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // Find consultation using Account ID directly
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        astrologer: astrologer._id,
    }).populate("user", "accountId");
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found or you are not authorized");
    }
    // Check if consultation is already handled
    if (consultation.status !== "pending") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `This consultation is already ${consultation.status}`);
    }
    // Update status
    const updateData = {
        status: payload.status,
    };
    if (payload.status === "accepted") {
        updateData.acceptedAt = new Date();
        updateData.startedAt = new Date();
        yield (0, sendSingleNotification_1.sendSingleNotification)((_a = consultation === null || consultation === void 0 ? void 0 : consultation.user) === null || _a === void 0 ? void 0 : _a.accountId, "Consultation Accepted!", `Great news! Your consultation request with ${astrologer === null || astrologer === void 0 ? void 0 : astrologer.displayName} has been ACCEPTED. You can now start your session and get the guidance you seek.`);
    }
    if (payload.status === "declined") {
        updateData.declinedAt = new Date();
        yield (0, sendSingleNotification_1.sendSingleNotification)((_b = consultation === null || consultation === void 0 ? void 0 : consultation.user) === null || _b === void 0 ? void 0 : _b.accountId, "Consultation Declined", `We're sorry, but ${astrologer === null || astrologer === void 0 ? void 0 : astrologer.displayName} is currently unavailable for your consultation. Please try another astrologer who can assist you on your spiritual journey.`);
    }
    const updatedConsultation = yield consultation_model_1.default.findByIdAndUpdate(consultationId, updateData, { new: true })
        .populate("user", "firstName lastName email profilePicture")
        .populate("astrologer", "firstName lastName displayName profilePicture");
    return updatedConsultation;
});
/* Get Single Consultation */
const getSingleConsultation = (consultationId, accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId });
    const user = yield user_model_1.User.findOne({ accountId });
    if (!user && !astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User or astrologer not found");
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
const endConsultationSession = (consultationId, accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const consultation = yield consultation_model_1.default.findById(consultationId);
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found");
    }
    ;
    const result = yield consultation_model_1.default.findOneAndUpdate({ _id: consultationId }, { status: "ended", endedBy: accountId }, { new: true });
    return result;
});
/* Add Review for Consultation */
const addReview = (consultationId, userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // Validate rating (1-5)
    if (payload.rating < 1 || payload.rating > 5) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Rating must be between 1 and 5");
    }
    const user = yield user_model_1.User.findOne({ accountId: userId });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // Find consultation and check if it belongs to the user
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        user: user === null || user === void 0 ? void 0 : user._id,
        status: "ended",
    }).populate("astrologer", "accountId")
        .populate("user", "fullName");
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found or not ended yet. You can only review ended consultations.");
    }
    // Check if review already exists for this consultation
    if (consultation.review && consultation.rating) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You have already reviewed this consultation");
    }
    // Update consultation with review
    consultation.review = payload.review;
    consultation.rating = payload.rating;
    yield consultation.save();
    // Find the astrologer
    const astrologer = yield astrologer_model_1.Astrologer.findById(consultation.astrologer);
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // Check if user already reviewed this astrologer
    const existingReviewIndex = (_a = astrologer.reviews) === null || _a === void 0 ? void 0 : _a.findIndex((review) => review.user.toString() === userId);
    if (existingReviewIndex !== undefined && existingReviewIndex !== -1) {
        // Update existing review
        astrologer.reviews[existingReviewIndex].review = payload.review;
        astrologer.reviews[existingReviewIndex].rating = payload.rating;
    }
    else {
        // Add new review to astrologer
        if (!astrologer.reviews) {
            astrologer.reviews = [];
        }
        astrologer.reviews.push({
            user: user === null || user === void 0 ? void 0 : user._id,
            review: payload.review,
            rating: payload.rating,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    // Recalculate average rating
    const totalRating = astrologer.reviews.reduce((sum, rev) => sum + rev.rating, 0);
    astrologer.rating = totalRating / astrologer.reviews.length;
    yield astrologer.save();
    // Populate consultation with user and astrologer details
    const updatedConsultation = yield consultation_model_1.default.findById(consultationId)
        .populate("user", "firstName lastName email profilePicture")
        .populate("astrologer", "firstName lastName displayName profilePicture");
    yield (0, sendSingleNotification_1.sendSingleNotification)((_b = consultation === null || consultation === void 0 ? void 0 : consultation.astrologer) === null || _b === void 0 ? void 0 : _b.accountId, `${(_c = consultation === null || consultation === void 0 ? void 0 : consultation.user) === null || _c === void 0 ? void 0 : _c.fullName} has left a review for you with rating ${payload.rating}`, payload === null || payload === void 0 ? void 0 : payload.review);
    return {
        success: true,
        message: "Review added successfully",
        data: {
            consultation: updatedConsultation,
            astrologerRating: astrologer.rating,
            totalReviews: astrologer.reviews.length,
        },
    };
});
exports.ConsultationServices = {
    requestConsultation,
    getMyConsultationBookings,
    getMyConsultationRequests,
    changeConsultationStatus,
    getSingleConsultation,
    endConsultationSession,
    addReview
};

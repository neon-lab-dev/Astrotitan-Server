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
exports.KundliRequestServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const user_model_1 = require("../users/user.model");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const kundliRequest_model_1 = __importDefault(require("./kundliRequest.model"));
const infinitePaginate_1 = require("../../utils/infinitePaginate");
const astrologer_model_1 = require("../astrologer/astrologer.model");
const sendSingleNotification_1 = require("../../utils/sendSingleNotification");
const accounts_model_1 = require("../accounts/accounts.model");
// Send Kundli Request(User)
const sendKundliRequest = (userId, payload, files) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Check if user exists
    const user = yield user_model_1.User.findOne({ accountId: userId });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // 3. Upload existing kundli files if any (for analyzeKundli)
    let existingKundliFiles = [];
    if (files && files.length > 0) {
        const uploads = files.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`kundli-file-${Date.now()}-${index}`, file.path);
            return secure_url;
        }));
        existingKundliFiles = yield Promise.all(uploads);
    }
    // 4. Create kundli request
    const kundliRequest = yield kundliRequest_model_1.default.create({
        userId: user._id,
        requestType: payload.requestType,
        existingKundliFiles,
        userName: payload.userName,
        userPhoneNumber: payload.userPhoneNumber,
        dateOfBirth: payload.dateOfBirth,
        timeOfBirth: payload.timeOfBirth,
        placeOfBirth: payload.placeOfBirth,
        userGender: payload.userGender,
        kundliType: payload.kundliType,
        userNotes: payload.userNotes,
        status: "pending",
    });
    const admin = yield accounts_model_1.Accounts.findOne({ role: "admin" });
    if (!admin) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Admin not found");
    }
    yield (0, sendSingleNotification_1.sendSingleNotification)(admin._id, "New Kundli Request Received", `You have received a new Kundli request from ${user === null || user === void 0 ? void 0 : user.firstName} ${user === null || user === void 0 ? void 0 : user.lastName}. Please check Kundli page for more details.`);
    return kundliRequest;
});
// Get My Kundli Requests (User)
const getMyKundliRequests = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, filters = {}, skip = 0, limit = 10) {
    const user = yield user_model_1.User.findOne({ accountId: userId });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const query = { userId: user._id };
    if (filters.status && filters.status !== "all") {
        query.status = filters.status;
    }
    const result = yield (0, infinitePaginate_1.infinitePaginate)(kundliRequest_model_1.default, query, skip, limit, [
        {
            path: "userId",
            select: "firstName lastName email profilePicture",
        },
        {
            path: "astrologerId",
            select: "firstName lastName displayName profilePicture",
        },
    ]);
    return result;
});
const getSingleKundliRequestById = (requestId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield kundliRequest_model_1.default.findById(requestId);
    if (!result) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Request not found");
    }
    return result;
});
/* Get All Products */
const getAllKundliRequests = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
    if (filters.requestType) {
        query.requestType = filters.requestType;
    }
    if (filters.keyword) {
        query.$text = {
            $search: filters.keyword,
        };
    }
    return (0, infinitePaginate_1.infinitePaginate)(kundliRequest_model_1.default, query, skip, limit, [
        {
            path: "userId",
            select: "firstName lastName profilePicture accountId"
        },
        {
            path: "astrologerId",
            select: "firstName lastName displayName profilePicture accountId"
        },
    ]);
});
// Get Kundli Requests for Astrologer
const getAstrologerKundliRequests = (astrologerId_1, ...args_1) => __awaiter(void 0, [astrologerId_1, ...args_1], void 0, function* (astrologerId, filters = {}, skip = 0, limit = 10) {
    const astrologer = yield astrologer_model_1.Astrologer.findById(astrologerId);
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    const query = { astrologerId };
    if (filters.status && filters.status !== "all") {
        query.status = filters.status;
    }
    const result = yield (0, infinitePaginate_1.infinitePaginate)(kundliRequest_model_1.default, query, skip, limit, [
        {
            path: "userId",
            select: "firstName lastName email profilePicture",
        },
        {
            path: "astrologerId",
            select: "firstName lastName displayName profilePicture",
        },
    ]);
    return result;
});
// Submit Kundli Report (Astrologer)
const submitKundliReport = (astrologerId, requestId, file) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Check if astrologer exists
    const astrologer = yield astrologer_model_1.Astrologer.findById(astrologerId);
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // 2. Find kundli request
    const kundliRequest = yield kundliRequest_model_1.default.findOne({
        _id: requestId,
        astrologerId,
    });
    if (!kundliRequest) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Kundli request not found or not assigned to you");
    }
    // 3. Check if already completed
    if (kundliRequest.status === "completed") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Kundli report already submitted");
    }
    // 4. Upload report file
    if (!file) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Report file is required");
    }
    const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`kundli-report-${Date.now()}`, file.path);
    // 5. Update kundli request
    kundliRequest.reportUrl = secure_url;
    kundliRequest.status = "completed";
    kundliRequest.completedAt = new Date();
    yield kundliRequest.save();
    yield (0, sendSingleNotification_1.sendSingleNotification)(kundliRequest === null || kundliRequest === void 0 ? void 0 : kundliRequest.userId, "Your Kundli Report is ready", `Your Kundli report is ready. Please check Kundli page to download and for more details.`);
    return kundliRequest;
});
const assignAstrologer = (requestId, astrologerId) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologer = yield astrologer_model_1.Astrologer.findById(astrologerId);
    const kundliRequest = yield kundliRequest_model_1.default.findById(requestId).populate("userId", "firstName lastName");
    if (!kundliRequest) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Kundli request not found");
    }
    kundliRequest.astrologerId = astrologerId;
    kundliRequest.isAssigned = true;
    yield kundliRequest.save();
    const requestType = kundliRequest.requestType;
    const user = kundliRequest.userId;
    const title = requestType === "generateKundli" ? "New Kundli Generate Request Assigned" : "New Kundli Analysis Request Assigned";
    const message = requestType === "generateKundli" ?
        `You have been assigned to create a new Kundli for ${user === null || user === void 0 ? void 0 : user.firstName} ${user === null || user === void 0 ? void 0 : user.lastName}. Please check Kundli page for more details.` :
        `You have been assigned to analyze Kundli for ${user === null || user === void 0 ? void 0 : user.firstName} ${user === null || user === void 0 ? void 0 : user.lastName}. Please check Kundli page for more details.`;
    yield (0, sendSingleNotification_1.sendSingleNotification)(astrologer === null || astrologer === void 0 ? void 0 : astrologer.accountId, title, message);
    return kundliRequest;
});
exports.KundliRequestServices = {
    sendKundliRequest,
    getMyKundliRequests,
    getSingleKundliRequestById,
    getAllKundliRequests,
    getAstrologerKundliRequests,
    submitKundliReport,
    assignAstrologer,
};

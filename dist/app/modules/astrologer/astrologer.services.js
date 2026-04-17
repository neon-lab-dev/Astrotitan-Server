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
exports.AstrologerServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const accounts_model_1 = require("../accounts/accounts.model");
const astrologer_model_1 = require("./astrologer.model");
const infinitePaginate_1 = require("../../utils/infinitePaginate");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const getAllAstrologer = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
    // Search functionality (text search on name fields)
    if (filters.keyword) {
        query.$or = [
            { firstName: { $regex: filters.keyword, $options: "i" } },
            { lastName: { $regex: filters.keyword, $options: "i" } },
            { displayName: { $regex: filters.keyword, $options: "i" } },
            { bio: { $regex: filters.keyword, $options: "i" } },
        ];
    }
    // Filter by identity verification status
    if (filters.isIdentityVerified === "true") {
        query.isIdentityVerified = true;
    }
    else if (filters.isIdentityVerified === "false") {
        query.isIdentityVerified = false;
    }
    // Filter by country
    if (filters.country) {
        query.country = { $regex: filters.country, $options: "i" };
    }
    // Filter by gender
    if (filters.gender) {
        query.gender = filters.gender;
    }
    // Filter by area of practice
    if (filters.areaOfPractice) {
        query.areaOfPractice = { $in: [filters.areaOfPractice] };
    }
    // Filter by consult languages
    if (filters.consultLanguages) {
        query.consultLanguages = { $in: [filters.consultLanguages] };
    }
    // Get paginated results
    const result = yield (0, infinitePaginate_1.infinitePaginate)(astrologer_model_1.Astrologer, query, skip, limit, []);
    // Populate account details for each astrologer
    const astrologersWithAccount = yield Promise.all(result.data.map((astrologer) => __awaiter(void 0, void 0, void 0, function* () {
        const account = yield accounts_model_1.Accounts.findById(astrologer.accountId).select("-otp -loginOtp -resetOtp -password");
        return Object.assign(Object.assign({}, astrologer.toObject()), { accountDetails: account });
    })));
    return {
        data: astrologersWithAccount,
        meta: result.meta,
    };
});
const getSingleAstrologerById = (astrologerId) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologer = yield astrologer_model_1.Astrologer.findById(astrologerId);
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // Get account details
    const account = yield accounts_model_1.Accounts.findById(astrologer.accountId).select("-otp -loginOtp -resetOtp");
    return Object.assign(Object.assign({}, astrologer.toObject()), { accountDetails: account });
});
const updateIdentityStatus = (astrologerId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologer = yield astrologer_model_1.Astrologer.findById(astrologerId);
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // Update identity status
    astrologer.identity.status = payload.status;
    if (payload.status === "rejected" && payload.rejectedReason) {
        astrologer.identity.rejectedReason = payload.rejectedReason;
    }
    // Set identity verified flag
    if (payload.status === "approved") {
        astrologer.isIdentityVerified = true;
        astrologer.identity.rejectedReason = null;
    }
    else {
        astrologer.isIdentityVerified = false;
    }
    yield astrologer.save();
    return {
        success: true,
        message: `Identity ${payload.status === "approved" ? "approved" : "rejected"} successfully`,
        data: {
            astrologerId: astrologer._id,
            identityStatus: astrologer.identity.status,
            isIdentityVerified: astrologer.isIdentityVerified,
        },
    };
});
const getPendingIdentityRequests = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (skip = 0, limit = 10) {
    const query = { "identity.status": "pending" };
    const result = yield (0, infinitePaginate_1.infinitePaginate)(astrologer_model_1.Astrologer, query, skip, limit, []);
    // Populate account details
    const astrologersWithAccount = yield Promise.all(result.data.map((astrologer) => __awaiter(void 0, void 0, void 0, function* () {
        const account = yield accounts_model_1.Accounts.findById(astrologer.accountId).select("firstName lastName email phoneNumber profilePicture");
        return Object.assign(Object.assign({}, astrologer.toObject()), { accountDetails: account });
    })));
    return {
        data: astrologersWithAccount,
        meta: result.meta,
    };
});
exports.AstrologerServices = {
    getAllAstrologer,
    getSingleAstrologerById,
    updateIdentityStatus,
    getPendingIdentityRequests,
};

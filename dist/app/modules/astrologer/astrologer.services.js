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
const user_model_1 = require("../users/user.model");
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
    // Filter by identity status (pending, approved, rejected)
    if (filters.identityStatus) {
        query["identity.status"] = filters.identityStatus;
    }
    // Filter by profile completion
    if (filters.isProfileCompleted === "true") {
        query.isProfileCompleted = true;
    }
    else if (filters.isProfileCompleted === "false") {
        query.isProfileCompleted = false;
    }
    // Filter by country
    if (filters.country) {
        query.country = { $regex: filters.country, $options: "i" };
    }
    // Filter by gender
    if (filters.gender) {
        query.gender = filters.gender;
    }
    // Filter by area of practice (supports array from frontend)
    if (filters.areaOfPractice) {
        const areas = Array.isArray(filters.areaOfPractice)
            ? filters.areaOfPractice
            : [filters.areaOfPractice];
        query.areaOfPractice = { $in: areas };
    }
    // Filter by consult languages (supports array from frontend)
    if (filters.consultLanguages) {
        const languages = Array.isArray(filters.consultLanguages)
            ? filters.consultLanguages
            : [filters.consultLanguages];
        query.consultLanguages = { $in: languages };
    }
    // Rating filter (e.g., rating >= 3 and rating < 4)
    if (filters.minRating) {
        const ratingValue = parseInt(filters.minRating);
        if (!isNaN(ratingValue) && ratingValue >= 1 && ratingValue <= 5) {
            query.rating = {
                $gte: ratingValue,
                $lt: ratingValue + 1
            };
        }
    }
    // Get paginated results
    const result = yield (0, infinitePaginate_1.infinitePaginate)(astrologer_model_1.Astrologer, query, skip, limit, []);
    // Convert all documents to plain objects first to remove Mongoose internal properties
    let astrologersList = result.data.map((astrologer) => {
        // Convert to plain object and remove internal fields
        const plain = astrologer.toObject ? astrologer.toObject() : Object.assign({}, astrologer);
        return plain;
    });
    // Handle relevance sorting (requires user's intents)
    if (filters.sortBy === "relevance" && filters.userId) {
        const userAccount = yield user_model_1.User.findOne({ accountId: filters.userId }).select("intents");
        const userIntents = (userAccount === null || userAccount === void 0 ? void 0 : userAccount.intents) || [];
        if (userIntents.length > 0) {
            astrologersList = astrologersList.map((astrologer) => {
                let relevanceScore = 0;
                userIntents.forEach((intent) => {
                    var _a;
                    if ((_a = astrologer.areaOfPractice) === null || _a === void 0 ? void 0 : _a.some((practice) => practice.toLowerCase().includes(intent.toLowerCase()))) {
                        relevanceScore++;
                    }
                });
                return Object.assign(Object.assign({}, astrologer), { relevanceScore });
            });
            astrologersList.sort((a, b) => b.relevanceScore - a.relevanceScore);
        }
    }
    // Sort by top rated (highest rating first)
    else if (filters.sortBy === "topRated") {
        astrologersList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    // Sort by most experienced (parse experience string to number)
    else if (filters.sortBy === "mostExperienced") {
        astrologersList.sort((a, b) => {
            const expA = parseInt(a.experience) || 0;
            const expB = parseInt(b.experience) || 0;
            return expB - expA;
        });
    }
    // Populate account details for each astrologer
    const astrologersWithAccount = yield Promise.all(astrologersList.map((astrologer) => __awaiter(void 0, void 0, void 0, function* () {
        const account = yield accounts_model_1.Accounts.findById(astrologer.accountId).select("_id email phoneNumber profilePicture role isSuspended suspensionReason");
        return Object.assign(Object.assign({}, astrologer), { accountDetails: account ? account.toObject() : null });
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
    const account = yield accounts_model_1.Accounts.findById(astrologer.accountId).select("_id email phoneNumber profilePicture role isSuspended suspensionReason");
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
/* Add Review */
const addReview = (astrologerId, userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Validate rating (1-5)
    if (payload.rating < 1 || payload.rating > 5) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Rating must be between 1 and 5");
    }
    // Find astrologer
    const astrologer = yield astrologer_model_1.Astrologer.findById(astrologerId);
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // Check if user already reviewed this astrologer
    const existingReviewIndex = (_a = astrologer.reviews) === null || _a === void 0 ? void 0 : _a.findIndex((review) => review.user.toString() === userId);
    if (existingReviewIndex !== undefined && existingReviewIndex !== -1) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You have already reviewed this astrologer. You can update your review instead.");
    }
    // Add new review
    const newReview = {
        user: userId,
        review: payload.review,
        rating: payload.rating,
    };
    if (!astrologer.reviews) {
        astrologer.reviews = [];
    }
    astrologer.reviews.push(newReview);
    // Calculate new average rating
    const totalRating = astrologer.reviews.reduce((sum, rev) => sum + rev.rating, 0);
    astrologer.rating = totalRating / astrologer.reviews.length;
    yield astrologer.save();
    return {
        success: true,
        message: "Review added successfully",
        data: {
            review: newReview,
            averageRating: astrologer.rating,
            totalReviews: astrologer.reviews.length,
        },
    };
});
/* Update Review */
const updateReview = (astrologerId, userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Validate rating if provided
    if (payload.rating && (payload.rating < 1 || payload.rating > 5)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Rating must be between 1 and 5");
    }
    // Find astrologer
    const astrologer = yield astrologer_model_1.Astrologer.findById(astrologerId);
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // Find the review index
    const reviewIndex = (_a = astrologer.reviews) === null || _a === void 0 ? void 0 : _a.findIndex((review) => review.user.toString() === userId);
    if (reviewIndex === undefined || reviewIndex === -1) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Review not found");
    }
    // Update review
    const review = astrologer.reviews[reviewIndex];
    if (payload.review)
        review.review = payload.review;
    if (payload.rating)
        review.rating = payload.rating;
    review.updatedAt = new Date();
    // Recalculate average rating
    const totalRating = astrologer.reviews.reduce((sum, rev) => sum + rev.rating, 0);
    astrologer.rating = totalRating / astrologer.reviews.length;
    yield astrologer.save();
    return {
        success: true,
        message: "Review updated successfully",
        data: {
            review,
            averageRating: astrologer.rating,
            totalReviews: astrologer.reviews.length,
        },
    };
});
/* Delete Review */
const deleteReview = (astrologerId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // Find astrologer
    const astrologer = yield astrologer_model_1.Astrologer.findById(astrologerId);
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // Find the review index
    const reviewIndex = (_a = astrologer.reviews) === null || _a === void 0 ? void 0 : _a.findIndex((review) => review.user.toString() === userId);
    if (reviewIndex === undefined || reviewIndex === -1) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Review not found");
    }
    // Remove review
    (_b = astrologer.reviews) === null || _b === void 0 ? void 0 : _b.splice(reviewIndex, 1);
    // Recalculate average rating (or set to 0 if no reviews)
    if (astrologer.reviews && astrologer.reviews.length > 0) {
        const totalRating = astrologer.reviews.reduce((sum, rev) => sum + rev.rating, 0);
        astrologer.rating = totalRating / astrologer.reviews.length;
    }
    else {
        astrologer.rating = 0;
    }
    yield astrologer.save();
    return {
        success: true,
        message: "Review deleted successfully",
        data: {
            averageRating: astrologer.rating,
            totalReviews: ((_c = astrologer.reviews) === null || _c === void 0 ? void 0 : _c.length) || 0,
        },
    };
});
exports.AstrologerServices = {
    getAllAstrologer,
    getSingleAstrologerById,
    updateIdentityStatus,
    getPendingIdentityRequests,
    addReview,
    updateReview,
    deleteReview,
};

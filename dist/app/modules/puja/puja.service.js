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
exports.PujaServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const puja_model_1 = __importDefault(require("./puja.model"));
const deleteImageFromCloudinary_1 = require("../../utils/deleteImageFromCloudinary");
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const infinitePaginate_1 = require("../../utils/infinitePaginate");
const AppError_1 = __importDefault(require("../../errors/AppError"));
/* Add Puja */
const addPuja = (userId, payload, files) => __awaiter(void 0, void 0, void 0, function* () {
    let imageUrls = [];
    if (files && files.length > 0) {
        const uploads = files.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`puja-${Date.now()}-${index}`, file.path);
            return secure_url;
        }));
        imageUrls = yield Promise.all(uploads);
    }
    const puja = yield puja_model_1.default.create(Object.assign(Object.assign({}, payload), { imageUrls, addedBy: userId }));
    return puja;
});
/* Get All Pujas */
const getAllPujas = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
    if (filters.category) {
        query.category = filters.category;
    }
    if (filters.minPrice) {
        query.basePrice = { $gte: Number(filters.minPrice) };
    }
    if (filters.maxPrice) {
        query.basePrice = Object.assign(Object.assign({}, query.basePrice), { $lte: Number(filters.maxPrice) });
    }
    if (filters.minRating) {
        query.rating = { $gte: Number(filters.minRating) };
    }
    if (filters.keyword) {
        query.$text = {
            $search: filters.keyword,
        };
    }
    return (0, infinitePaginate_1.infinitePaginate)(puja_model_1.default, query, skip, limit, []);
});
/* Get Single Puja */
const getSinglePujaById = (pujaId) => __awaiter(void 0, void 0, void 0, function* () {
    const puja = yield puja_model_1.default.findById(pujaId);
    if (!puja) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Puja not found");
    }
    return puja;
});
/* Update Puja */
const updatePuja = (pujaId, userId, payload, files, imagesToDelete) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const puja = yield puja_model_1.default.findById(pujaId);
    if (!puja) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Puja not found");
    }
    // Check authorization (only admin or creator can update)
    if (((_a = puja.addedBy) === null || _a === void 0 ? void 0 : _a.toString()) !== userId.toString()) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You are not authorized to update this puja");
    }
    let imageUrls = puja.imageUrls || [];
    // Delete specified images from Cloudinary
    if (imagesToDelete && imagesToDelete.length > 0) {
        yield Promise.all(imagesToDelete.map((imageUrl) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const publicId = (_a = imageUrl.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
            if (publicId) {
                yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
            }
        })));
        // Remove deleted images from array
        imageUrls = imageUrls.filter((url) => !imagesToDelete.includes(url));
    }
    // Upload new images
    if (files && files.length > 0) {
        const uploads = files.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`puja-${Date.now()}-${index}`, file.path);
            return secure_url;
        }));
        const newImages = yield Promise.all(uploads);
        imageUrls = [...imageUrls, ...newImages];
    }
    const updatedPuja = yield puja_model_1.default.findByIdAndUpdate(pujaId, Object.assign(Object.assign({}, payload), { imageUrls }), { new: true });
    return updatedPuja;
});
/* Delete Puja */
const deletePuja = (pujaId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const puja = yield puja_model_1.default.findById(pujaId);
    if (!puja) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Puja not found");
    }
    // Check authorization
    if (((_a = puja.addedBy) === null || _a === void 0 ? void 0 : _a.toString()) !== userId.toString()) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You are not authorized to delete this puja");
    }
    // Delete all puja images from Cloudinary
    if ((_b = puja.imageUrls) === null || _b === void 0 ? void 0 : _b.length) {
        yield Promise.all(puja.imageUrls.map((url) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const publicId = (_a = url.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
            if (publicId) {
                yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
            }
        })));
    }
    // Delete all review images from Cloudinary
    if ((_c = puja.reviews) === null || _c === void 0 ? void 0 : _c.length) {
        for (const review of puja.reviews) {
            if ((_d = review.images) === null || _d === void 0 ? void 0 : _d.length) {
                yield Promise.all(review.images.map((imageUrl) => __awaiter(void 0, void 0, void 0, function* () {
                    var _a;
                    const publicId = (_a = imageUrl.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
                    if (publicId) {
                        yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
                    }
                })));
            }
        }
    }
    yield puja_model_1.default.findByIdAndDelete(pujaId);
    return true;
});
/* Add Review */
const addReview = (pujaId, userId, payload, files) => __awaiter(void 0, void 0, void 0, function* () {
    const puja = yield puja_model_1.default.findById(pujaId);
    if (!puja) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Puja not found");
    }
    // Check if user already reviewed this puja
    const existingReview = puja.reviews.find((review) => review.user.toString() === userId.toString());
    if (existingReview) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You have already reviewed this puja");
    }
    // Upload review images
    let imageUrls = [];
    if (files && files.length > 0) {
        const uploads = files.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`puja-review-${pujaId}-${userId}-${Date.now()}-${index}`, file.path);
            return secure_url;
        }));
        imageUrls = yield Promise.all(uploads);
    }
    // Add review
    puja.reviews.push({
        user: userId,
        review: payload.review,
        rating: payload.rating,
        images: imageUrls,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    // Update puja average rating
    const totalRating = puja.reviews.reduce((sum, review) => sum + review.rating, 0);
    puja.rating = totalRating / puja.reviews.length;
    yield puja.save();
    const newReview = puja.reviews[puja.reviews.length - 1];
    return {
        success: true,
        message: "Review added successfully",
        data: newReview,
    };
});
/* Update Review */
const updateReview = (pujaId, reviewId, userId, payload, files, imagesToDelete) => __awaiter(void 0, void 0, void 0, function* () {
    const puja = yield puja_model_1.default.findById(pujaId);
    if (!puja) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Puja not found");
    }
    const reviewIndex = puja.reviews.findIndex((review) => review._id.toString() === reviewId && review.user.toString() === userId.toString());
    if (reviewIndex === -1) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Review not found or you are not authorized");
    }
    const review = puja.reviews[reviewIndex];
    // Delete specified images from Cloudinary
    if (imagesToDelete && imagesToDelete.length > 0) {
        yield Promise.all(imagesToDelete.map((imageUrl) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const publicId = (_a = imageUrl.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
            if (publicId) {
                yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
            }
        })));
        review.images = review.images.filter((img) => !imagesToDelete.includes(img));
    }
    // Upload new images
    if (files && files.length > 0) {
        const uploads = files.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`puja-review-${pujaId}-${userId}-${Date.now()}-${index}`, file.path);
            return secure_url;
        }));
        const newImages = yield Promise.all(uploads);
        review.images = [...review.images, ...newImages];
    }
    // Update review fields
    if (payload.review)
        review.review = payload.review;
    if (payload.rating)
        review.rating = payload.rating;
    review.updatedAt = new Date();
    // Update puja average rating
    const totalRating = puja.reviews.reduce((sum, r) => sum + r.rating, 0);
    puja.rating = totalRating / puja.reviews.length;
    yield puja.save();
    return {
        success: true,
        message: "Review updated successfully",
        data: review,
    };
});
/* Delete Review */
const deleteReview = (pujaId, reviewId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const puja = yield puja_model_1.default.findById(pujaId);
    if (!puja) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Puja not found");
    }
    const reviewIndex = puja.reviews.findIndex((review) => review._id.toString() === reviewId && review.user.toString() === userId.toString());
    if (reviewIndex === -1) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Review not found or you are not authorized");
    }
    const review = puja.reviews[reviewIndex];
    // Delete review images from Cloudinary
    if (review.images && review.images.length > 0) {
        yield Promise.all(review.images.map((imageUrl) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const publicId = (_a = imageUrl.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
            if (publicId) {
                yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
            }
        })));
    }
    // Remove review
    puja.reviews.splice(reviewIndex, 1);
    // Update puja average rating
    if (puja.reviews.length > 0) {
        const totalRating = puja.reviews.reduce((sum, r) => sum + r.rating, 0);
        puja.rating = totalRating / puja.reviews.length;
    }
    else {
        puja.rating = 0;
    }
    yield puja.save();
    return {
        success: true,
        message: "Review deleted successfully",
    };
});
/* Get All Reviews for a Puja */
const getPujaReviews = (pujaId_1, ...args_1) => __awaiter(void 0, [pujaId_1, ...args_1], void 0, function* (pujaId, skip = 0, limit = 10) {
    const puja = yield puja_model_1.default.findById(pujaId).select("reviews");
    if (!puja) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Puja not found");
    }
    const reviews = puja.reviews;
    const total = reviews.length;
    const paginatedReviews = reviews.slice(skip, skip + limit);
    return {
        data: paginatedReviews,
        meta: {
            skip,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
});
exports.PujaServices = {
    addPuja,
    getAllPujas,
    getSinglePujaById,
    updatePuja,
    deletePuja,
    addReview,
    updateReview,
    deleteReview,
    getPujaReviews,
};

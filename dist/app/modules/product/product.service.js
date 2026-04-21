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
exports.ProductServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const product_model_1 = __importDefault(require("./product.model"));
const deleteImageFromCloudinary_1 = require("../../utils/deleteImageFromCloudinary");
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const infinitePaginate_1 = require("../../utils/infinitePaginate");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const addProduct = (userId, payload, files) => __awaiter(void 0, void 0, void 0, function* () {
    let imageUrls = [];
    if (files.length) {
        const uploads = files.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`product-${Date.now()}-${index}`, file.path);
            return secure_url;
        }));
        imageUrls = yield Promise.all(uploads);
    }
    const product = yield product_model_1.default.create(Object.assign(Object.assign({}, payload), { imageUrls, addedBy: userId }));
    return product;
});
/* Get All Products */
const getAllProducts = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
    if (filters.category) {
        query.category = filters.category;
    }
    if (filters.keyword) {
        query.$text = {
            $search: filters.keyword,
        };
    }
    return (0, infinitePaginate_1.infinitePaginate)(product_model_1.default, query, skip, limit, []);
});
/* Get Single Product */
const getSingleProductById = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.default.findById(productId);
    if (!product) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    return product;
});
/* Update Product */
const updateProduct = (productId, userId, payload, files) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.default.findById(productId);
    if (!product) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    let imageUrls = product.imageUrls || [];
    if (files === null || files === void 0 ? void 0 : files.length) {
        const uploads = files.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`product-${Date.now()}-${index}`, file.path);
            return secure_url;
        }));
        const uploadedImages = yield Promise.all(uploads);
        imageUrls = [...imageUrls, ...uploadedImages];
    }
    const updatedProduct = yield product_model_1.default.findByIdAndUpdate(productId, Object.assign(Object.assign({}, payload), { imageUrls }), { new: true });
    return updatedProduct;
});
const deleteProduct = (productId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const product = yield product_model_1.default.findById(productId);
    if (!product) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    /* Delete images from cloudinary */
    if ((_a = product.imageUrls) === null || _a === void 0 ? void 0 : _a.length) {
        yield Promise.all(product.imageUrls.map((url) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const publicId = (_a = url.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
            if (publicId) {
                yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
            }
        })));
    }
    yield product_model_1.default.findByIdAndDelete(productId);
    return true;
});
/* Add Review */
const addReview = (productId, userId, payload, files) => __awaiter(void 0, void 0, void 0, function* () {
    // Find product
    const product = yield product_model_1.default.findById(productId);
    if (!product) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    // Check if user already reviewed this product
    const existingReview = product.reviews.find((review) => review.user.toString() === userId.toString());
    if (existingReview) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You have already reviewed this product");
    }
    // Upload review images
    let imageUrls = [];
    if (files && files.length > 0) {
        const uploads = files.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`review-${productId}-${userId}-${Date.now()}-${index}`, file.path);
            return secure_url;
        }));
        imageUrls = yield Promise.all(uploads);
    }
    // Add review
    product.reviews.push({
        user: userId,
        review: payload.review,
        rating: payload.rating,
        images: imageUrls
    });
    // Update product average rating
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    product.rating = totalRating / product.reviews.length;
    yield product.save();
    // Return the newly added review
    const newReview = product.reviews[product.reviews.length - 1];
    return {
        success: true,
        message: "Review added successfully",
        data: newReview,
    };
});
/* Update Review */
const updateReview = (productId, reviewId, userId, payload, files, imagesToDelete // Array of image URLs to delete
) => __awaiter(void 0, void 0, void 0, function* () {
    // Find product
    const product = yield product_model_1.default.findById(productId);
    if (!product) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    // Find the review
    const reviewIndex = product.reviews.findIndex((review) => review._id.toString() === reviewId && review.user.toString() === userId.toString());
    if (reviewIndex === -1) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Review not found or you are not authorized");
    }
    const review = product.reviews[reviewIndex];
    // Delete specified images from Cloudinary
    if (imagesToDelete && imagesToDelete.length > 0) {
        yield Promise.all(imagesToDelete.map((imageUrl) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const publicId = (_a = imageUrl.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
            if (publicId) {
                yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
            }
        })));
        // Remove deleted images from review
        review.images = review.images.filter((img) => !imagesToDelete.includes(img));
    }
    // Upload new images
    if (files && files.length > 0) {
        const uploads = files.map((file, index) => __awaiter(void 0, void 0, void 0, function* () {
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`review-${productId}-${userId}-${Date.now()}-${index}`, file.path);
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
    // Update product average rating
    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = totalRating / product.reviews.length;
    yield product.save();
    return {
        success: true,
        message: "Review updated successfully",
        data: review,
    };
});
/* Delete Review */
const deleteReview = (productId, reviewId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Find product
    const product = yield product_model_1.default.findById(productId);
    if (!product) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    // Find the review
    const reviewIndex = product.reviews.findIndex((review) => review._id.toString() === reviewId && review.user.toString() === userId.toString());
    if (reviewIndex === -1) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Review not found or you are not authorized");
    }
    const review = product.reviews[reviewIndex];
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
    product.reviews.splice(reviewIndex, 1);
    // Update product average rating
    if (product.reviews.length > 0) {
        const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
        product.rating = totalRating / product.reviews.length;
    }
    else {
        product.rating = 0;
    }
    yield product.save();
    return {
        success: true,
        message: "Review deleted successfully",
    };
});
exports.ProductServices = {
    addProduct,
    getAllProducts,
    getSingleProductById,
    updateProduct,
    deleteProduct,
    addReview,
    updateReview,
    deleteReview
};

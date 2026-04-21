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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const product_service_1 = require("./product.service");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const addProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const files = req.files || [];
    const result = yield product_service_1.ProductServices.addProduct(req.user.userId, req.body, files);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Product added successfully",
        data: result,
    });
}));
/* Get All Products */
const getAllProducts = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { keyword, category, skip = "0", limit = "10" } = req.query;
    const filters = {
        keyword: keyword,
        category: category,
    };
    const result = yield product_service_1.ProductServices.getAllProducts(filters, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Products fetched successfully",
        data: result,
    });
}));
/* Get Single Product */
const getSingleProductById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const result = yield product_service_1.ProductServices.getSingleProductById(productId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Product fetched successfully",
        data: result,
    });
}));
/* Update Product */
const updateProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const files = req.files || [];
    const result = yield product_service_1.ProductServices.updateProduct(productId, req.user.userId, req.body, files);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Product updated successfully",
        data: result,
    });
}));
const deleteProduct = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const result = yield product_service_1.ProductServices.deleteProduct(productId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Product deleted successfully",
        data: result,
    });
}));
/* Add Review */
const addReview = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.params;
    const userId = req.user._id;
    const files = req.files;
    const result = yield product_service_1.ProductServices.addReview(productId, userId, req.body, files);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Review added successfully",
        data: result,
    });
}));
/* Update Review */
const updateReview = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, reviewId } = req.params;
    const userId = req.user._id;
    const files = req.files;
    const _a = req.body, { imagesToDelete } = _a, payload = __rest(_a, ["imagesToDelete"]);
    const result = yield product_service_1.ProductServices.updateReview(productId, reviewId, userId, payload, files, imagesToDelete ? JSON.parse(imagesToDelete) : undefined);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Review updated successfully",
        data: result,
    });
}));
/* Delete Review */
const deleteReview = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId, reviewId } = req.params;
    const userId = req.user._id;
    const result = yield product_service_1.ProductServices.deleteReview(productId, reviewId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Review deleted successfully",
        data: result,
    });
}));
exports.ProductControllers = {
    addProduct,
    getAllProducts,
    getSingleProductById,
    updateProduct,
    deleteProduct,
    addReview,
    updateReview,
    deleteReview
};

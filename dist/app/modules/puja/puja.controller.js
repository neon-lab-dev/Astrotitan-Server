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
exports.PujaControllers = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const puja_service_1 = require("./puja.service");
/* Add Puja */
const addPuja = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const files = req.files;
    const result = yield puja_service_1.PujaServices.addPuja(userId, req.body, files);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Puja added successfully",
        data: result,
    });
}));
/* Get All Pujas */
const getAllPujas = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { keyword, category, minPrice, maxPrice, minRating, skip = "0", limit = "10", } = req.query;
    const filters = {
        keyword: keyword,
        category: category,
        minPrice: minPrice,
        maxPrice: maxPrice,
        minRating: minRating,
    };
    const result = yield puja_service_1.PujaServices.getAllPujas(filters, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Pujas retrieved successfully",
        data: {
            pujas: result.data,
            meta: result.meta,
        },
    });
}));
/* Get Single Puja */
const getSinglePujaById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pujaId } = req.params;
    const result = yield puja_service_1.PujaServices.getSinglePujaById(pujaId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Puja retrieved successfully",
        data: result,
    });
}));
/* Update Puja */
const updatePuja = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pujaId } = req.params;
    const userId = req.user._id;
    const files = req.files;
    const _a = req.body, { imagesToDelete } = _a, payload = __rest(_a, ["imagesToDelete"]);
    const result = yield puja_service_1.PujaServices.updatePuja(pujaId, userId, payload, files, imagesToDelete ? JSON.parse(imagesToDelete) : undefined);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Puja updated successfully",
        data: result,
    });
}));
/* Delete Puja */
const deletePuja = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pujaId } = req.params;
    const userId = req.user._id;
    const result = yield puja_service_1.PujaServices.deletePuja(pujaId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Puja deleted successfully",
        data: result,
    });
}));
/* Add Review */
const addReview = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pujaId } = req.params;
    const userId = req.user._id;
    const files = req.files;
    const result = yield puja_service_1.PujaServices.addReview(pujaId, userId, req.body, files);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Review added successfully",
        data: result,
    });
}));
/* Update Review */
const updateReview = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pujaId, reviewId } = req.params;
    const userId = req.user._id;
    const files = req.files;
    const _a = req.body, { imagesToDelete } = _a, payload = __rest(_a, ["imagesToDelete"]);
    const result = yield puja_service_1.PujaServices.updateReview(pujaId, reviewId, userId, payload, files, imagesToDelete ? JSON.parse(imagesToDelete) : undefined);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Review updated successfully",
        data: result,
    });
}));
/* Delete Review */
const deleteReview = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pujaId, reviewId } = req.params;
    const userId = req.user._id;
    const result = yield puja_service_1.PujaServices.deleteReview(pujaId, reviewId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Review deleted successfully",
        data: result,
    });
}));
/* Get Puja Reviews */
const getPujaReviews = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pujaId } = req.params;
    const { skip = "0", limit = "10" } = req.query;
    const result = yield puja_service_1.PujaServices.getPujaReviews(pujaId, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Puja reviews retrieved successfully",
        data: result,
    });
}));
exports.PujaControllers = {
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

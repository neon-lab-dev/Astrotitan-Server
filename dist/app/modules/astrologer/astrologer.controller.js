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
exports.AstrologerControllers = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const astrologer_services_1 = require("./astrologer.services");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const getAllAstrologer = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { keyword, identityStatus, isProfileCompleted, country, gender, areaOfPractice, consultLanguages, skip = "0", limit = "10", } = req.query;
    const filters = {
        keyword: keyword,
        identityStatus: identityStatus,
        isProfileCompleted: isProfileCompleted,
        country: country,
        gender: gender,
        areaOfPractice: areaOfPractice,
        consultLanguages: consultLanguages,
    };
    const result = yield astrologer_services_1.AstrologerServices.getAllAstrologer(filters, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Astrologers retrieved successfully",
        data: {
            astrologers: result.data,
            meta: result.meta,
        },
    });
}));
const getSingleAstrologerById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { astrologerId } = req.params;
    const result = yield astrologer_services_1.AstrologerServices.getSingleAstrologerById(astrologerId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Astrologer data fetched successfully.",
        data: result,
    });
}));
const updateIdentityStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { astrologerId } = req.params;
    const result = yield astrologer_services_1.AstrologerServices.updateIdentityStatus(astrologerId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: result.message,
        data: result.data,
    });
}));
const getPendingIdentityRequests = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { skip = "0", limit = "10" } = req.query;
    const result = yield astrologer_services_1.AstrologerServices.getPendingIdentityRequests(Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Pending identity requests retrieved successfully",
        data: {
            astrologers: result.data,
            meta: result.meta,
        },
    });
}));
exports.AstrologerControllers = {
    getAllAstrologer,
    getSingleAstrologerById,
    updateIdentityStatus,
    getPendingIdentityRequests,
};

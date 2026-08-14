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
exports.KundliRequestControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const kundliRequest_service_1 = require("./kundliRequest.service");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
//Send Kundli Request (User)
const sendKundliRequest = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const files = req.files;
    const result = yield kundliRequest_service_1.KundliRequestServices.sendKundliRequest(userId, req.body, files);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Kundli request sent successfully",
        data: result,
    });
}));
//Get My Kundli Requests (User)
const getMyKundliRequests = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { status, skip = "0", limit = "10" } = req.query;
    const result = yield kundliRequest_service_1.KundliRequestServices.getMyKundliRequests(userId, { status: status }, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Kundli requests fetched successfully",
        data: result,
    });
}));
const getSingleKundliRequestById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { requestId } = req.params;
    const result = yield kundliRequest_service_1.KundliRequestServices.getSingleKundliRequestById(requestId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Product fetched successfully",
        data: result,
    });
}));
//Get Kundli Requests for Astrologer
const getAstrologerKundliRequests = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologerId = req.user._id;
    const { status, skip = "0", limit = "10" } = req.query;
    const result = yield kundliRequest_service_1.KundliRequestServices.getAstrologerKundliRequests(astrologerId, { status: status }, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Kundli requests fetched successfully",
        data: result,
    });
}));
//Submit Kundli Report (Astrologer)
const submitKundliReport = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologerId = req.user._id;
    const { requestId } = req.params;
    const file = req.file;
    const result = yield kundliRequest_service_1.KundliRequestServices.submitKundliReport(astrologerId, requestId, file);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Kundli report submitted successfully",
        data: result,
    });
}));
exports.KundliRequestControllers = {
    sendKundliRequest,
    getMyKundliRequests,
    getSingleKundliRequestById,
    getAstrologerKundliRequests,
    submitKundliReport,
};

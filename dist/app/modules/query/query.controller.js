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
exports.QueryControllers = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const query_service_1 = require("./query.service");
/* User: Raise a Query */
const raiseQuery = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const files = req.files;
    const result = yield query_service_1.QueryServices.raiseQuery(userId, req.body, files);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Query raised successfully. Our team will get back to you soon.",
        data: result,
    });
}));
/* User: Get My Queries */
const getMyQueries = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { skip = "0", limit = "10", status } = req.query;
    const filters = {
        status: status,
    };
    const result = yield query_service_1.QueryServices.getMyQueries(userId, Number(skip), Number(limit), filters);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Queries fetched successfully",
        data: result,
    });
}));
/* User: Get Single Query */
const getSingleQuery = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { queryId } = req.params;
    const result = yield query_service_1.QueryServices.getSingleQuery(queryId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Query fetched successfully",
        data: result,
    });
}));
/* User: Add Attachment */
const addAttachment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { queryId } = req.params;
    const files = req.files;
    const result = yield query_service_1.QueryServices.addAttachment(queryId, userId, files);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Attachment added successfully",
        data: result,
    });
}));
/* User: Delete My Query */
const deleteMyQuery = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { queryId } = req.params;
    const result = yield query_service_1.QueryServices.deleteMyQuery(queryId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Query deleted successfully",
        data: result,
    });
}));
/* Admin: Get All Queries */
const getAllQueries = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, issueType, keyword, skip = "0", limit = "10" } = req.query;
    const filters = {
        status: status,
        issueType: issueType,
        keyword: keyword,
    };
    const result = yield query_service_1.QueryServices.getAllQueries(filters, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "All queries fetched successfully",
        data: result,
    });
}));
/* Admin: Get Single Query */
const getSingleQueryForAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { queryId } = req.params;
    const result = yield query_service_1.QueryServices.getSingleQueryForAdmin(queryId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Query fetched successfully",
        data: result,
    });
}));
/* Admin: Update Query Status */
const updateQueryStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { queryId } = req.params;
    const result = yield query_service_1.QueryServices.updateQueryStatus(queryId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Query status updated successfully",
        data: result,
    });
}));
/* Admin: Delete Query */
const deleteQuery = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { queryId } = req.params;
    const result = yield query_service_1.QueryServices.deleteQuery(queryId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Query deleted successfully",
        data: result,
    });
}));
exports.QueryControllers = {
    raiseQuery,
    getMyQueries,
    getSingleQuery,
    addAttachment,
    deleteMyQuery,
    getAllQueries,
    getSingleQueryForAdmin,
    updateQueryStatus,
    deleteQuery,
};

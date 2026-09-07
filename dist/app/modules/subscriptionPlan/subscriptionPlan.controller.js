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
exports.SubscriptionPlanController = void 0;
// subscriptionPlan.controller.ts
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const subscriptionPlan_service_1 = require("./subscriptionPlan.service");
const createPlan = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield subscriptionPlan_service_1.SubscriptionPlanServices.createPlan(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Plan created successfully",
        data: result,
    });
}));
// For admin/
const getAllPlans = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { isActive, keyword, skip = "0", limit = "10" } = req.query;
    const filters = {
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
        keyword: keyword,
    };
    const result = yield subscriptionPlan_service_1.SubscriptionPlanServices.getAllPlans(filters, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Plans fetched successfully",
        data: result,
    });
}));
const getAllPlansForUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { skip = "0", limit = "10" } = req.query;
    const result = yield subscriptionPlan_service_1.SubscriptionPlanServices.getAllPlansForUser(Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Plans fetched successfully",
        data: result,
    });
}));
const getPlanById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield subscriptionPlan_service_1.SubscriptionPlanServices.getPlanById(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Plan fetched successfully",
        data: result,
    });
}));
const updatePlan = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield subscriptionPlan_service_1.SubscriptionPlanServices.updatePlan(req.params.id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Plan updated successfully",
        data: result,
    });
}));
const deletePlan = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield subscriptionPlan_service_1.SubscriptionPlanServices.deletePlan(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Plan deleted successfully",
        data: result,
    });
}));
const togglePlanStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield subscriptionPlan_service_1.SubscriptionPlanServices.togglePlanStatus(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: `Plan ${result.isActive ? "activated" : "deactivated"} successfully`,
        data: result,
    });
}));
exports.SubscriptionPlanController = {
    createPlan,
    getAllPlans,
    getAllPlansForUser,
    getPlanById,
    updatePlan,
    deletePlan,
    togglePlanStatus,
};

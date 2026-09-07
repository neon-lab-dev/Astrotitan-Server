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
exports.SubscriptionPlanServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const subscriptionPlan_model_1 = __importDefault(require("./subscriptionPlan.model"));
const infinitePaginate_1 = require("../../utils/infinitePaginate");
const createPlan = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield subscriptionPlan_model_1.default.findOne({ name: payload.name });
    if (existing) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Plan with this name already exists");
    }
    return yield subscriptionPlan_model_1.default.create(payload);
});
// For admin
const getAllPlans = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
    // Status filter
    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
    }
    // Search filter
    if (filters.keyword) {
        query.$or = [
            { name: { $regex: filters.keyword, $options: "i" } },
            { description: { $regex: filters.keyword, $options: "i" } },
        ];
    }
    return (0, infinitePaginate_1.infinitePaginate)(subscriptionPlan_model_1.default, query, skip, limit, []);
});
// For user
const getAllPlansForUser = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (skip = 0, limit = 10) {
    const query = { isActive: true };
    return (0, infinitePaginate_1.infinitePaginate)(subscriptionPlan_model_1.default, query, skip, limit, []);
});
const getPlanById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const plan = yield subscriptionPlan_model_1.default.findById(id);
    if (!plan)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Plan not found");
    return plan;
});
const updatePlan = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const plan = yield subscriptionPlan_model_1.default.findById(id);
    if (!plan)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Plan not found");
    if (payload.name && payload.name !== plan.name) {
        const existing = yield subscriptionPlan_model_1.default.findOne({ name: payload.name });
        if (existing)
            throw new AppError_1.default(http_status_1.default.CONFLICT, "Plan with this name already exists");
    }
    return yield subscriptionPlan_model_1.default.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
});
const deletePlan = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const plan = yield subscriptionPlan_model_1.default.findById(id);
    if (!plan)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Plan not found");
    yield subscriptionPlan_model_1.default.findByIdAndDelete(id);
    return { message: "Plan deleted successfully" };
});
const togglePlanStatus = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const plan = yield subscriptionPlan_model_1.default.findById(id);
    if (!plan)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Plan not found");
    plan.isActive = !plan.isActive;
    yield plan.save();
    return plan;
});
exports.SubscriptionPlanServices = {
    createPlan,
    getAllPlans,
    getAllPlansForUser,
    getPlanById,
    updatePlan,
    deletePlan,
    togglePlanStatus,
};

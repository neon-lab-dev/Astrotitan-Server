/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { TSubscriptionPlan } from "./subscriptionPlan.interface";
import SubscriptionPlan from "./subscriptionPlan.model";
import { infinitePaginate } from "../../utils/infinitePaginate";

const createPlan = async (payload: Partial<TSubscriptionPlan>) => {
    const existing = await SubscriptionPlan.findOne({ name: payload.name });
    if (existing) {
        throw new AppError(httpStatus.CONFLICT, "Plan with this name already exists");
    }
    return await SubscriptionPlan.create(payload);
};
// For admin
const getAllPlans = async (
    filters: any = {},
    skip = 0,
    limit = 10
) => {
    const query: any = {};

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

    return infinitePaginate(SubscriptionPlan, query, skip, limit, []);
};

// For user
const getAllPlansForUser = async (
    skip = 0,
    limit = 10
) => {
    const query: any = { isActive: true };

    return infinitePaginate(SubscriptionPlan, query, skip, limit, []);
};

const getPlanById = async (id: string) => {
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) throw new AppError(httpStatus.NOT_FOUND, "Plan not found");
    return plan;
};

const updatePlan = async (id: string, payload: Partial<TSubscriptionPlan>) => {
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) throw new AppError(httpStatus.NOT_FOUND, "Plan not found");

    if (payload.name && payload.name !== plan.name) {
        const existing = await SubscriptionPlan.findOne({ name: payload.name });
        if (existing) throw new AppError(httpStatus.CONFLICT, "Plan with this name already exists");
    }

    return await SubscriptionPlan.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
};

const deletePlan = async (id: string) => {
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) throw new AppError(httpStatus.NOT_FOUND, "Plan not found");
    await SubscriptionPlan.findByIdAndDelete(id);
    return { message: "Plan deleted successfully" };
};

const togglePlanStatus = async (id: string) => {
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) throw new AppError(httpStatus.NOT_FOUND, "Plan not found");
    plan.isActive = !plan.isActive;
    await plan.save();
    return plan;
};

export const SubscriptionPlanServices = {
    createPlan,
    getAllPlans,
    getAllPlansForUser,
    getPlanById,
    updatePlan,
    deletePlan,
    togglePlanStatus,
};
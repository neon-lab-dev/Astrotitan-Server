// subscriptionPlan.controller.ts
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SubscriptionPlanServices } from "./subscriptionPlan.service";

const createPlan = catchAsync(async (req, res) => {
  const result = await SubscriptionPlanServices.createPlan(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Plan created successfully",
    data: result,
  });
});
// For admin/
const getAllPlans = catchAsync(async (req, res) => {
  const { isActive, keyword, skip = "0", limit = "10" } = req.query;
  const filters = {
    isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
    keyword: keyword as string,
  };
  const result = await SubscriptionPlanServices.getAllPlans(
    filters,
    Number(skip),
    Number(limit)
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Plans fetched successfully",
    data: result,
  });
});

const getAllPlansForUser = catchAsync(async (req, res) => {
  const { skip = "0", limit = "10" } = req.query;

  const result = await SubscriptionPlanServices.getAllPlansForUser(
    Number(skip),
    Number(limit)
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Plans fetched successfully",
    data: result,
  });
});

const getPlanById = catchAsync(async (req, res) => {
  const result = await SubscriptionPlanServices.getPlanById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Plan fetched successfully",
    data: result,
  });
});

const updatePlan = catchAsync(async (req, res) => {
  const result = await SubscriptionPlanServices.updatePlan(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Plan updated successfully",
    data: result,
  });
});

const deletePlan = catchAsync(async (req, res) => {
  const result = await SubscriptionPlanServices.deletePlan(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Plan deleted successfully",
    data: result,
  });
});

const togglePlanStatus = catchAsync(async (req, res) => {
  const result = await SubscriptionPlanServices.togglePlanStatus(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Plan ${result.isActive ? "activated" : "deactivated"} successfully`,
    data: result,
  });
});

export const SubscriptionPlanController = {
  createPlan,
  getAllPlans,
  getAllPlansForUser,
  getPlanById,
  updatePlan,
  deletePlan,
  togglePlanStatus,
};
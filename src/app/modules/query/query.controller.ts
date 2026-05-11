/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { QueryServices } from "./query.service";

/* User: Raise a Query */
const raiseQuery = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const files = req.files as Express.Multer.File[];

  const result = await QueryServices.raiseQuery(userId, req.body, files);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Query raised successfully. Our team will get back to you soon.",
    data: result,
  });
});

/* User: Get My Queries */
const getMyQueries = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { skip = "0", limit = "10", status } = req.query;

  const filters = {
    status: status as string,
  };

  const result = await QueryServices.getMyQueries(
    userId,
    Number(skip),
    Number(limit),
    filters
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Queries fetched successfully",
    data: result,
  });
});

/* User: Get Single Query */
const getSingleQuery = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { queryId } = req.params;

  const result = await QueryServices.getSingleQuery(queryId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Query fetched successfully",
    data: result,
  });
});

/* User: Add Attachment */
const addAttachment = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { queryId } = req.params;
  const files = req.files as Express.Multer.File[];

  const result = await QueryServices.addAttachment(queryId, userId, files);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Attachment added successfully",
    data: result,
  });
});

/* User: Delete My Query */
const deleteMyQuery = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { queryId } = req.params;

  const result = await QueryServices.deleteMyQuery(queryId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Query deleted successfully",
    data: result,
  });
});

/* Admin: Get All Queries */
const getAllQueries = catchAsync(async (req, res) => {
  const { 
    status, 
    issueType, 
    keyword, 
    skip = "0", 
    limit = "10" 
  } = req.query;

  const filters = {
    status: status as string,
    issueType: issueType as string,
    keyword: keyword as string,
  };

  const result = await QueryServices.getAllQueries(
    filters,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All queries fetched successfully",
    data: result,
  });
});

/* Admin: Get Single Query */
const getSingleQueryForAdmin = catchAsync(async (req, res) => {
  const { queryId } = req.params;

  const result = await QueryServices.getSingleQueryForAdmin(queryId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Query fetched successfully",
    data: result,
  });
});

/* Admin: Update Query Status */
const updateQueryStatus = catchAsync(async (req, res) => {
  const { queryId } = req.params;

  const result = await QueryServices.updateQueryStatus(queryId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Query status updated successfully",
    data: result,
  });
});

/* Admin: Delete Query */
const deleteQuery = catchAsync(async (req, res) => {
  const { queryId } = req.params;

  const result = await QueryServices.deleteQuery(queryId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Query deleted successfully",
    data: result,
  });
});

export const QueryControllers = {
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
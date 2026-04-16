/* eslint-disable @typescript-eslint/no-explicit-any */
import { AstrologerServices } from "./astrologer.services";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";

const getAllAstrologer = catchAsync(async (req, res) => {
  const {
    keyword,
    isIdentityVerified,
    isProfileCompleted,
    country,
    gender,
    areaOfPractice,
    consultLanguages,
    skip = "0",
    limit = "10",
  } = req.query;

  const filters = {
    keyword: keyword as string,
    isIdentityVerified: isIdentityVerified as string,
    isProfileCompleted: isProfileCompleted as string,
    country: country as string,
    gender: gender as string,
    areaOfPractice: areaOfPractice as string,
    consultLanguages: consultLanguages as string,
  };

  const result = await AstrologerServices.getAllAstrologer(
    filters,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Astrologers retrieved successfully",
    data: {
      astrologers: result.data,
      meta: result.meta,
    },
  });
});

const getSingleAstrologerById = catchAsync(async (req, res) => {
  const { astrologerId } = req.params;
  const result = await AstrologerServices.getSingleAstrologerById(astrologerId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Astrologer data fetched successfully.",
    data: result,
  });
});

const updateIdentityStatus = catchAsync(async (req, res) => {
  const { astrologerId } = req.params;
  const result = await AstrologerServices.updateIdentityStatus(astrologerId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

const getPendingIdentityRequests = catchAsync(async (req, res) => {
  const { skip = "0", limit = "10" } = req.query;
  
  const result = await AstrologerServices.getPendingIdentityRequests(
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Pending identity requests retrieved successfully",
    data: {
      astrologers: result.data,
      meta: result.meta,
    },
  });
});

export const AstrologerControllers = {
  getAllAstrologer,
  getSingleAstrologerById,
  updateIdentityStatus,
  getPendingIdentityRequests,
};
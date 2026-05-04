/* eslint-disable @typescript-eslint/no-explicit-any */
import { AstrologerServices } from "./astrologer.services";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";

const getAllAstrologer = catchAsync(async (req, res) => {
  const {
    keyword,
    identityStatus,
    isProfileCompleted,
    country,
    gender,
    areaOfPractice,
    consultLanguages,
    minRating,
    sortBy,
    skip = "0",
    limit = "10",
  } = req.query;

  // Parse areaOfPractice if it's a string (can be comma-separated or multiple values)
  let areaOfPracticeArray: string | string[] | undefined = areaOfPractice as string;
  if (areaOfPracticeArray && areaOfPracticeArray.includes(',')) {
    areaOfPracticeArray = (areaOfPracticeArray as string).split(',');
  }

  // Parse consultLanguages if it's a string
  let consultLanguagesArray: string | string[] | undefined = consultLanguages as string;
  if (consultLanguagesArray && consultLanguagesArray.includes(',')) {
    consultLanguagesArray = (consultLanguagesArray as string).split(',');
  }

  const filters = {
    keyword: keyword as string,
    identityStatus: identityStatus as string,
    isProfileCompleted: isProfileCompleted as string,
    country: country as string,
    gender: gender as string,
    areaOfPractice: areaOfPracticeArray,
    consultLanguages: consultLanguagesArray,
    minRating: minRating as string,
    sortBy: sortBy as "topRated" | "mostExperienced" | "relevance",
    userId: req.user?._id, // For relevance sorting
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

/* Add Review */
const addReview = catchAsync(async (req, res) => {
  const { astrologerId } = req.params;
  const userId = req.user._id;
  const { review, rating } = req.body;

  const result = await AstrologerServices.addReview(astrologerId, userId, {
    review,
    rating: Number(rating),
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review added successfully",
    data: result,
  });
});

/* Update Review */
const updateReview = catchAsync(async (req, res) => {
  const { astrologerId } = req.params;
  const userId = req.user._id;
  const { review, rating } = req.body;

  const result = await AstrologerServices.updateReview(astrologerId, userId, {
    review,
    rating: rating ? Number(rating) : undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review updated successfully",
    data: result,
  });
});

/* Delete Review */
const deleteReview = catchAsync(async (req, res) => {
  const { astrologerId } = req.params;
  const userId = req.user._id;

  const result = await AstrologerServices.deleteReview(astrologerId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review deleted successfully",
    data: result,
  });
});

export const AstrologerControllers = {
  getAllAstrologer,
  getSingleAstrologerById,
  updateIdentityStatus,
  getPendingIdentityRequests,
  addReview,
  updateReview,
  deleteReview,
};
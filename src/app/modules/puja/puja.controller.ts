/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PujaServices } from "./puja.service";

/* Add Puja */
const addPuja = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const files = req.files as Express.Multer.File[];

  const result = await PujaServices.addPuja(userId, req.body, files);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Puja added successfully",
    data: result,
  });
});

/* Get All Pujas */
const getAllPujas = catchAsync(async (req, res) => {
  const {
    keyword,
    category,
    minPrice,
    maxPrice,
    minRating,
    skip = "0",
    limit = "10",
  } = req.query;

  const filters = {
    keyword: keyword as string,
    category: category as string,
    minPrice: minPrice as string,
    maxPrice: maxPrice as string,
    minRating: minRating as string,
  };

  const result = await PujaServices.getAllPujas(
    filters,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Pujas retrieved successfully",
    data: {
      pujas: result.data,
      meta: result.meta,
    },
  });
});

/* Get Single Puja */
const getSinglePujaById = catchAsync(async (req, res) => {
  const { pujaId } = req.params;
  const result = await PujaServices.getSinglePujaById(pujaId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Puja retrieved successfully",
    data: result,
  });
});

/* Update Puja */
const updatePuja = catchAsync(async (req, res) => {
  const { pujaId } = req.params;
  const files = req.files as Express.Multer.File[];
  const { imagesToDelete, ...payload } = req.body;

  const result = await PujaServices.updatePuja(
    pujaId,
    payload,
    files,
    imagesToDelete ? JSON.parse(imagesToDelete) : undefined
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Puja updated successfully",
    data: result,
  });
});

/* Delete Puja */
const deletePuja = catchAsync(async (req, res) => {
  const { pujaId } = req.params;

  const result = await PujaServices.deletePuja(pujaId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Puja deleted successfully",
    data: result,
  });
});

/* Add Review */
const addReview = catchAsync(async (req, res) => {
  const { pujaId } = req.params;
  const userId = req.user._id;
  const files = req.files as Express.Multer.File[];

  const result = await PujaServices.addReview(pujaId, userId, req.body, files);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review added successfully",
    data: result,
  });
});

/* Update Review */
const updateReview = catchAsync(async (req, res) => {
  const { pujaId, reviewId } = req.params;
  const userId = req.user._id;
  const files = req.files as Express.Multer.File[];
  const { imagesToDelete, ...payload } = req.body;

  const result = await PujaServices.updateReview(
    pujaId,
    reviewId,
    userId,
    payload,
    files,
    imagesToDelete ? JSON.parse(imagesToDelete) : undefined
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review updated successfully",
    data: result,
  });
});

/* Delete Review */
const deleteReview = catchAsync(async (req, res) => {
  const { pujaId, reviewId } = req.params;
  const userId = req.user._id;

  const result = await PujaServices.deleteReview(pujaId, reviewId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review deleted successfully",
    data: result,
  });
});

/* Get Puja Reviews */
const getPujaReviews = catchAsync(async (req, res) => {
  const { pujaId } = req.params;
  const { skip = "0", limit = "10" } = req.query;

  const result = await PujaServices.getPujaReviews(
    pujaId,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Puja reviews retrieved successfully",
    data: result,
  });
});

export const PujaControllers = {
  addPuja,
  getAllPujas,
  getSinglePujaById,
  updatePuja,
  deletePuja,
  addReview,
  updateReview,
  deleteReview,
  getPujaReviews,
};
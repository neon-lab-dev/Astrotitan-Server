import httpStatus from "http-status";
import { ProductServices } from "./product.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

const addProduct = catchAsync(async (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];

  const result = await ProductServices.addProduct(
    req.user.userId,
    req.body,
    files
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product added successfully",
    data: result,
  });
});

/* Get All Products */
const getAllProducts = catchAsync(async (req, res) => {

  const { keyword, category, skip = "0", limit = "10" } = req.query;

  const filters = {
    keyword: keyword as string,
    category: category as string,
  };

  const result = await ProductServices.getAllProducts(
    filters,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Products fetched successfully",
    data: result,
  });
});


/* Get Single Product */
const getSingleProductById = catchAsync(async (req, res) => {

  const { productId } = req.params;

  const result = await ProductServices.getSingleProductById(productId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product fetched successfully",
    data: result,
  });
});

/* Update Product */
const updateProduct = catchAsync(async (req, res) => {

  const { productId } = req.params;

  const files = (req.files as Express.Multer.File[]) || [];

  const result = await ProductServices.updateProduct(
    productId,
    req.user.userId,
    req.body,
    files
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product updated successfully",
    data: result,
  });
});

const deleteProduct = catchAsync(async (req, res) => {
  const { productId } = req.params;

  const result = await ProductServices.deleteProduct(
    productId
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product deleted successfully",
    data: result,
  });
});

/* Add Review */
const addReview = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;
  const files = req.files as Express.Multer.File[];

  const result = await ProductServices.addReview(
    productId,
    userId,
    req.body,
    files
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review added successfully",
    data: result,
  });
});

/* Update Review */
const updateReview = catchAsync(async (req, res) => {
  const { productId, reviewId } = req.params;
  const userId = req.user._id;
  const files = req.files as Express.Multer.File[];
  const { imagesToDelete, ...payload } = req.body;

  const result = await ProductServices.updateReview(
    productId,
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
  const { productId, reviewId } = req.params;
  const userId = req.user._id;

  const result = await ProductServices.deleteReview(productId, reviewId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review deleted successfully",
    data: result,
  });
});



export const ProductControllers = {
  addProduct,
  getAllProducts,
  getSingleProductById,
  updateProduct,
  deleteProduct,
  addReview,
  updateReview,
  deleteReview
};
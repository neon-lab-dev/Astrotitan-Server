import httpStatus from "http-status";
import { CategoryServices } from "./categories.services";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

// Add a category (Admin only)
const addCategory = catchAsync(async (req, res) => {
  const result = await CategoryServices.addCategory(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category added successfully",
    data: result,
  });
});

// Get all categories
const getAllCategoriesByAreaName = catchAsync(async (req, res) => {
  const { areaName } = req.params;
  const result = await CategoryServices.getAllCategoriesByAreaName(areaName);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Categories fetched successfully",
    data: result,
  });
});

// Get single category by ID
const getSingleCategoryById = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  const result = await CategoryServices.getSingleCategoryById(categoryId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category fetched successfully",
    data: result,
  });
});

// Delete category by ID
const deleteCategory = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  const result = await CategoryServices.deleteCategory(categoryId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category deleted successfully",
    data: result,
  });
});

export const CategoryController = {
  addCategory,
  getAllCategoriesByAreaName,
  getSingleCategoryById,
  deleteCategory,
};

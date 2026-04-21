import express from "express";
import { CategoryController } from "./categories.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../accounts/accounts.constants";

const router = express.Router();

// Add category (admin only)
router.post(
  "/add",
  auth(UserRole.admin),
  CategoryController.addCategory
);

// Get all categories
router.get("/:areaName", CategoryController.getAllCategoriesByAreaName);

// Get a single category by ID
router.get("/:categoryId", CategoryController.getSingleCategoryById);

// Delete a category (admin only)
router.delete(
  "/delete/:categoryId",
  auth(UserRole.admin),
  CategoryController.deleteCategory
);

export const CategoryRoutes = router;

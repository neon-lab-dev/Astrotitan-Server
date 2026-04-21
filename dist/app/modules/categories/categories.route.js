"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const categories_controller_1 = require("./categories.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const accounts_constants_1 = require("../accounts/accounts.constants");
const router = express_1.default.Router();
// Add category (admin only)
router.post("/add", (0, auth_1.default)(accounts_constants_1.UserRole.admin), categories_controller_1.CategoryController.addCategory);
// Get all categories
router.get("/:areaName", categories_controller_1.CategoryController.getAllCategoriesByAreaName);
// Get a single category by ID
router.get("/:categoryId", categories_controller_1.CategoryController.getSingleCategoryById);
// Delete a category (admin only)
router.delete("/delete/:categoryId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), categories_controller_1.CategoryController.deleteCategory);
exports.CategoryRoutes = router;

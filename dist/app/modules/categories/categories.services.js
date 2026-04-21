"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const categories_model_1 = __importDefault(require("./categories.model"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
// Add a category (Admin only)
const addCategory = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { category, areaName } = payload;
    const payloadData = {
        category,
        areaName,
    };
    const result = yield categories_model_1.default.create(payloadData);
    return result;
});
// Get all categories
const getAllCategoriesByAreaName = (areaName) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield categories_model_1.default.find({
        areaName: { $regex: `^${areaName}$`, $options: "i" },
    });
    return result;
});
// Get single category by ID
const getSingleCategoryById = (categoryId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield categories_model_1.default.findById(categoryId);
    if (!result) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Category not found");
    }
    return result;
});
// Delete category by ID
const deleteCategory = (categoryId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield categories_model_1.default.findByIdAndDelete(categoryId);
    if (!result) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Category not found");
    }
    return result;
});
exports.CategoryServices = {
    addCategory,
    getAllCategoriesByAreaName,
    getSingleCategoryById,
    deleteCategory,
};

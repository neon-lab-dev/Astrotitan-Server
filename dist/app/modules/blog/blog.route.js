"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogRoutes = void 0;
const express_1 = __importDefault(require("express"));
const blog_controller_1 = require("./blog.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const accounts_constants_1 = require("../accounts/accounts.constants");
const multer_config_1 = require("../../config/multer.config");
const router = express_1.default.Router();
// Create blog
router.post("/add", (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), multer_config_1.multerUpload.single("thumbnail"), blog_controller_1.BlogControllers.addBlog);
// Get my blogs
router.get("/my-blogs", (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), blog_controller_1.BlogControllers.getMyBlogs);
// Get single blog
router.get("/:blogId", blog_controller_1.BlogControllers.getSingleBlog);
// Public routes
router.get("/", blog_controller_1.BlogControllers.getAllBlogs);
// Update blog
router.patch("/update/:blogId", (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), multer_config_1.multerUpload.single("thumbnail"), blog_controller_1.BlogControllers.updateBlog);
// Delete blog
router.delete("/delete/:blogId", (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), blog_controller_1.BlogControllers.deleteBlog);
exports.BlogRoutes = router;

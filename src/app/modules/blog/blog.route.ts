import express from "express";
import { BlogControllers } from "./blog.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../accounts/accounts.constants";
import { multerUpload } from "../../config/multer.config";

const router = express.Router();


// Create blog
router.post(
    "/add",
    auth(UserRole.astrologer),
    multerUpload.single("thumbnail"),
    BlogControllers.addBlog
);

// Get my blogs
router.get(
    "/my-blogs",
    auth(UserRole.astrologer),
    BlogControllers.getMyBlogs
);

// Get single blog
router.get(
    "/:blogId",
    BlogControllers.getSingleBlog
);
// Public routes
router.get("/", BlogControllers.getAllBlogs);

// Update blog
router.patch(
    "/update/:blogId",
    auth(UserRole.astrologer),
    multerUpload.single("thumbnail"),
    BlogControllers.updateBlog
);

// Delete blog
router.delete(
    "/delete/:blogId",
    auth(UserRole.astrologer),
    BlogControllers.deleteBlog
);

export const BlogRoutes = router;
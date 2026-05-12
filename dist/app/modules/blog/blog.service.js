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
exports.BlogServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const blog_model_1 = require("./blog.model");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const infinitePaginate_1 = require("../../utils/infinitePaginate");
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const deleteImageFromCloudinary_1 = require("../../utils/deleteImageFromCloudinary");
const astrologer_model_1 = require("../astrologer/astrologer.model");
/* Add Blog */
const addBlog = (userId, payload, file) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId: userId });
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer profile not found");
    }
    // Upload thumbnail to Cloudinary
    let thumbnailUrl = "";
    if (file) {
        const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`blog-thumbnail-${astrologer === null || astrologer === void 0 ? void 0 : astrologer._id}-${Date.now()}`, file.path);
        thumbnailUrl = secure_url;
    }
    // Validate zodiacSpecific if blogType is zodiacTips
    if (payload.blogType === "zodiacTips" && !payload.zodiacSpecific) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Zodiac specific details are required for zodiac tips");
    }
    // Parse zodiacSpecific if it's a string
    let zodiacSpecific = payload.zodiacSpecific;
    if (typeof zodiacSpecific === "string") {
        zodiacSpecific = JSON.parse(zodiacSpecific);
    }
    const blog = yield blog_model_1.Blog.create(Object.assign(Object.assign({}, payload), { addedBy: astrologer === null || astrologer === void 0 ? void 0 : astrologer._id, thumbnail: thumbnailUrl, zodiacSpecific, status: payload.status || "draft" }));
    // Populate astrologer details
    const blogWithAstrologer = yield blog_model_1.Blog.findById(blog._id).populate("addedBy", "firstName lastName displayName profilePicture");
    return blogWithAstrologer;
});
/* Get All Blogs (Public) */
const getAllBlogs = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = { status: "live" }; // Only live blogs for public
    // Category filter
    if (filters.category) {
        query.category = filters.category;
    }
    // Blog type filter
    if (filters.blogType) {
        query.blogType = filters.blogType;
    }
    // Keyword search
    if (filters.keyword) {
        query.$text = {
            $search: filters.keyword,
        };
    }
    const result = yield (0, infinitePaginate_1.infinitePaginate)(blog_model_1.Blog, query, skip, limit, ["addedBy"]);
    return result;
});
/* Get My Blogs (Astrologer) */
const getMyBlogs = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, filters = {}, skip = 0, limit = 10) {
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId: userId });
    const query = { addedBy: astrologer === null || astrologer === void 0 ? void 0 : astrologer._id };
    if (filters.status) {
        query.status = filters.status;
    }
    if (filters.blogType) {
        query.blogType = filters.blogType;
    }
    const result = yield (0, infinitePaginate_1.infinitePaginate)(blog_model_1.Blog, query, skip, limit, []);
    return result;
});
/* Get Single Blog by ID (Public) */
const getSingleBlog = (blogId) => __awaiter(void 0, void 0, void 0, function* () {
    // await Blog.findByIdAndUpdate(blogId, { $inc: { views: 1 } });
    const blog = yield blog_model_1.Blog.findOne({ _id: blogId, status: "live" });
    if (!blog) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Blog not found");
    }
    return blog;
});
/* Get Single Blog for Admin/Astrologer */
const getSingleBlogForAdmin = (blogId, astrologerId) => __awaiter(void 0, void 0, void 0, function* () {
    const blog = yield blog_model_1.Blog.findOne({ _id: blogId, addedBy: astrologerId }).populate("addedBy", "firstName lastName displayName profilePicture");
    if (!blog) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Blog not found");
    }
    return blog;
});
/* Update Blog */
const updateBlog = (blogId, userId, payload, file, deleteThumbnail) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId: userId });
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer profile not found");
    }
    const blog = yield blog_model_1.Blog.findOne({ _id: blogId, addedBy: astrologer._id });
    if (!blog) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Blog not found");
    }
    let thumbnailUrl = blog.thumbnail || "";
    // Delete existing thumbnail if requested
    if (deleteThumbnail && blog.thumbnail) {
        const publicId = (_a = blog.thumbnail.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
        if (publicId) {
            yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
        }
        thumbnailUrl = "";
    }
    // Upload new thumbnail
    if (file) {
        // Delete old thumbnail if exists
        if (blog.thumbnail) {
            const publicId = (_b = blog.thumbnail.split("/").pop()) === null || _b === void 0 ? void 0 : _b.split(".")[0];
            if (publicId) {
                yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
            }
        }
        const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`blog-thumbnail-${astrologer._id}-${Date.now()}`, file.path);
        thumbnailUrl = secure_url;
    }
    // Parse zodiacSpecific if it's a string
    let zodiacSpecific = payload.zodiacSpecific;
    if (typeof zodiacSpecific === "string") {
        zodiacSpecific = JSON.parse(zodiacSpecific);
    }
    const updatedBlog = yield blog_model_1.Blog.findByIdAndUpdate(blogId, Object.assign(Object.assign({}, payload), { thumbnail: thumbnailUrl, zodiacSpecific: payload.blogType === "zodiacTips" ? zodiacSpecific : null }), { new: true }).populate("addedBy", "firstName lastName displayName profilePicture");
    return updatedBlog;
});
/* Delete Blog */
const deleteBlog = (blogId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId: userId });
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer profile not found");
    }
    const blog = yield blog_model_1.Blog.findOne({ _id: blogId, addedBy: astrologer._id });
    if (!blog) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Blog not found or you are not authorized");
    }
    // Delete thumbnail from Cloudinary
    if (blog.thumbnail) {
        const publicId = (_a = blog.thumbnail.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
        if (publicId) {
            yield (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(publicId);
        }
    }
    yield blog_model_1.Blog.findByIdAndDelete(blogId);
    return { message: "Blog deleted successfully" };
});
exports.BlogServices = {
    addBlog,
    getAllBlogs,
    getMyBlogs,
    getSingleBlog,
    getSingleBlogForAdmin,
    updateBlog,
    deleteBlog,
};

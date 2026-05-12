/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { Blog } from "./blog.model";
import AppError from "../../errors/AppError";
import { infinitePaginate } from "../../utils/infinitePaginate";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { deleteImageFromCloudinary } from "../../utils/deleteImageFromCloudinary";
import { Astrologer } from "../astrologer/astrologer.model";

/* Add Blog */
const addBlog = async (
    userId: string,
    payload: any,
    file?: Express.Multer.File
) => {
    const astrologer = await Astrologer.findOne({ accountId: userId });
    if (!astrologer) {
        throw new AppError(httpStatus.NOT_FOUND, "Astrologer profile not found");
    }
    // Upload thumbnail to Cloudinary
    let thumbnailUrl = "";
    if (file) {
        const { secure_url } = await sendImageToCloudinary(
            `blog-thumbnail-${astrologer?._id}-${Date.now()}`,
            file.path
        );
        thumbnailUrl = secure_url;
    }

    // Validate zodiacSpecific if blogType is zodiacTips
    if (payload.blogType === "zodiacTips" && !payload.zodiacSpecific) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Zodiac specific details are required for zodiac tips"
        );
    }

    // Parse zodiacSpecific if it's a string
    let zodiacSpecific = payload.zodiacSpecific;
    if (typeof zodiacSpecific === "string") {
        zodiacSpecific = JSON.parse(zodiacSpecific);
    }

    const blog = await Blog.create({
        ...payload,
        addedBy: astrologer?._id,
        thumbnail: thumbnailUrl,
        zodiacSpecific,
        status: payload.status || "draft",
    });

    // Populate astrologer details
    const blogWithAstrologer = await Blog.findById(blog._id).populate(
        "addedBy",
        "firstName lastName displayName profilePicture"
    );

    return blogWithAstrologer;
};

/* Get All Blogs (Public) */
const getAllBlogs = async (
    filters: {
        keyword?: string;
        category?: string;
        blogType?: string;
        status?: string;
    } = {},
    skip = 0,
    limit = 10
) => {
    const query: any = { status: "live" }; // Only live blogs for public

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

    const result = await infinitePaginate(
        Blog,
        query,
        skip,
        limit,
        ["addedBy"]
    );

    return result;
};

/* Get My Blogs (Astrologer) */
const getMyBlogs = async (
    userId: string,
    filters: {
        status?: string;
        blogType?: string;
    } = {},
    skip = 0,
    limit = 10
) => {
    const astrologer = await Astrologer.findOne({ accountId: userId });
    const query: any = { addedBy: astrologer?._id };

    if (filters.status) {
        query.status = filters.status;
    }
    if (filters.blogType) {
        query.blogType = filters.blogType;
    }

    const result = await infinitePaginate(
        Blog,
        query,
        skip,
        limit,
        []
    );

    return result;
};

/* Get Single Blog by ID (Public) */
const getSingleBlog = async (blogId: string) => {
    // await Blog.findByIdAndUpdate(blogId, { $inc: { views: 1 } });

    const blog = await Blog.findOne({ _id: blogId, status: "live" });

    if (!blog) {
        throw new AppError(httpStatus.NOT_FOUND, "Blog not found");
    }

    return blog;
};

/* Get Single Blog for Admin/Astrologer */
const getSingleBlogForAdmin = async (blogId: string, astrologerId: string) => {
    const blog = await Blog.findOne({ _id: blogId, addedBy: astrologerId }).populate(
        "addedBy",
        "firstName lastName displayName profilePicture"
    );

    if (!blog) {
        throw new AppError(httpStatus.NOT_FOUND, "Blog not found");
    }

    return blog;
};

/* Update Blog */
const updateBlog = async (
    blogId: string,
    userId: string,
    payload: any,
    file?: Express.Multer.File,
    deleteThumbnail?: boolean
) => {
    const astrologer = await Astrologer.findOne({ accountId: userId });
    if (!astrologer) {
        throw new AppError(httpStatus.NOT_FOUND, "Astrologer profile not found");
    }
    const blog = await Blog.findOne({ _id: blogId, addedBy: astrologer._id });

    if (!blog) {
        throw new AppError(httpStatus.NOT_FOUND, "Blog not found");
    }

    let thumbnailUrl = blog.thumbnail || "";

    // Delete existing thumbnail if requested
    if (deleteThumbnail && blog.thumbnail) {
        const publicId = blog.thumbnail.split("/").pop()?.split(".")[0];
        if (publicId) {
            await deleteImageFromCloudinary(publicId);
        }
        thumbnailUrl = "";
    }

    // Upload new thumbnail
    if (file) {
        // Delete old thumbnail if exists
        if (blog.thumbnail) {
            const publicId = blog.thumbnail.split("/").pop()?.split(".")[0];
            if (publicId) {
                await deleteImageFromCloudinary(publicId);
            }
        }
        const { secure_url } = await sendImageToCloudinary(
            `blog-thumbnail-${astrologer._id}-${Date.now()}`,
            file.path
        );
        thumbnailUrl = secure_url;
    }

    // Parse zodiacSpecific if it's a string
    let zodiacSpecific = payload.zodiacSpecific;
    if (typeof zodiacSpecific === "string") {
        zodiacSpecific = JSON.parse(zodiacSpecific);
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
        blogId,
        {
            ...payload,
            thumbnail: thumbnailUrl,
            zodiacSpecific: payload.blogType === "zodiacTips" ? zodiacSpecific : null,
        },
        { new: true }
    ).populate("addedBy", "firstName lastName displayName profilePicture");

    return updatedBlog;
};

/* Delete Blog */
const deleteBlog = async (blogId: string, userId: string) => {
    const astrologer = await Astrologer.findOne({ accountId: userId });
    if (!astrologer) {
        throw new AppError(httpStatus.NOT_FOUND, "Astrologer profile not found");
    }

    const blog = await Blog.findOne({ _id: blogId, addedBy: astrologer._id });

    if (!blog) {
        throw new AppError(httpStatus.NOT_FOUND, "Blog not found or you are not authorized");
    }

    // Delete thumbnail from Cloudinary
    if (blog.thumbnail) {
        const publicId = blog.thumbnail.split("/").pop()?.split(".")[0];
        if (publicId) {
            await deleteImageFromCloudinary(publicId);
        }
    }

    await Blog.findByIdAndDelete(blogId);

    return { message: "Blog deleted successfully" };
};

export const BlogServices = {
    addBlog,
    getAllBlogs,
    getMyBlogs,
    getSingleBlog,
    getSingleBlogForAdmin,
    updateBlog,
    deleteBlog,
};
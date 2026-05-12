/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BlogServices } from "./blog.service";

/* Add Blog */
const addBlog = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const file = req.file as Express.Multer.File;

  const result = await BlogServices.addBlog(userId, req.body, file);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Blog created successfully",
    data: result,
  });
});

/* Get All Blogs (Public) */
const getAllBlogs = catchAsync(async (req, res) => {
  const {
    keyword,
    category,
    blogType,
    skip = "0",
    limit = "10",
  } = req.query;

  const filters = {
    keyword: keyword as string,
    category: category as string,
    blogType: blogType as string,
  };

  const result = await BlogServices.getAllBlogs(
    filters,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blogs fetched successfully",
    data: result,
  });
});

/* Get My Blogs (Astrologer) */
const getMyBlogs = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { status, blogType, skip = "0", limit = "10" } = req.query;

  const filters = {
    status: status as string,
    blogType: blogType as string,
  };

  const result = await BlogServices.getMyBlogs(
    userId,
    filters,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your blogs fetched successfully",
    data: result,
  });
});

/* Get Single Blog (Public) */
const getSingleBlog = catchAsync(async (req, res) => {
  const { blogId } = req.params;
  const result = await BlogServices.getSingleBlog(blogId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog fetched successfully",
    data: result,
  });
});

/* Get Single Blog for Admin */
const getSingleBlogForAdmin = catchAsync(async (req, res) => {
  const astrologerId = req.user._id;
  const { blogId } = req.params;
  const result = await BlogServices.getSingleBlogForAdmin(blogId, astrologerId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog fetched successfully",
    data: result,
  });
});

/* Update Blog */
const updateBlog = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { blogId } = req.params;
  const file = req.file as Express.Multer.File;
  const { deleteThumbnail, ...payload } = req.body;

  const result = await BlogServices.updateBlog(
    blogId,
    userId,
    payload,
    file,
    deleteThumbnail === "true"
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog updated successfully",
    data: result,
  });
});

/* Delete Blog */
const deleteBlog = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { blogId } = req.params;
  const result = await BlogServices.deleteBlog(blogId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog deleted successfully",
    data: result,
  });
});

export const BlogControllers = {
  addBlog,
  getAllBlogs,
  getMyBlogs,
  getSingleBlog,
  getSingleBlogForAdmin,
  updateBlog,
  deleteBlog,
};
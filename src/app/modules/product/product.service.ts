/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import Product from "./product.model";
import { deleteImageFromCloudinary } from "../../utils/deleteImageFromCloudinary";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { infinitePaginate } from "../../utils/infinitePaginate";
import AppError from "../../errors/AppError";

const addProduct = async (
  userId: any,
  payload: any,
  files: Express.Multer.File[]
) => {

  let imageUrls: string[] = [];

  if (files.length) {
    const uploads = files.map(async (file, index) => {
      const { secure_url } = await sendImageToCloudinary(
        `product-${Date.now()}-${index}`,
        file.path
      );

      return secure_url;
    });

    imageUrls = await Promise.all(uploads);
  }

  const product = await Product.create({
    ...payload,
    imageUrls,
    addedBy: userId,
  });

  return product;
};

/* Get All Products */
const getAllProducts = async (
  filters: any = {},
  skip = 0,
  limit = 10
) => {

  const query: any = {};

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.keyword) {
    query.$text = {
      $search: filters.keyword,
    };
  }

  return infinitePaginate(Product, query, skip, limit, []);
};

/* Get Single Product */
const getSingleProductById = async (productId: string) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  return product;
};

/* Update Product */
const updateProduct = async (
  productId: string,
  userId: any,
  payload: any,
  files: Express.Multer.File[]
) => {

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  let imageUrls = product.imageUrls || [];

  if (files?.length) {

    const uploads = files.map(async (file, index) => {

      const { secure_url } = await sendImageToCloudinary(
        `product-${Date.now()}-${index}`,
        file.path
      );

      return secure_url;
    });

    const uploadedImages = await Promise.all(uploads);

    imageUrls = [...imageUrls, ...uploadedImages];
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      ...payload,
      imageUrls,
    },
    { new: true }
  );

  return updatedProduct;
};

const deleteProduct = async (productId: string) => {

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  /* Delete images from cloudinary */
  if (product.imageUrls?.length) {

    await Promise.all(
      product.imageUrls.map(async (url: string) => {

        const publicId = url.split("/").pop()?.split(".")[0];

        if (publicId) {
          await deleteImageFromCloudinary(publicId);
        }

      })
    );

  }

  await Product.findByIdAndDelete(productId);

  return true;
};

/* Add Review */
const addReview = async (
  productId: string,
  userId: any,
  payload: {
    review: string;
    rating: number;
  },
  files: Express.Multer.File[]
) => {
  // Find product
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  // Check if user already reviewed this product
  const existingReview = product.reviews!.find(
    (review: any) => review.user.toString() === userId.toString()
  );
  if (existingReview) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already reviewed this product"
    );
  }

  // Upload review images
  let imageUrls: string[] = [];
  if (files && files.length > 0) {
    const uploads = files.map(async (file, index) => {
      const { secure_url } = await sendImageToCloudinary(
        `review-${productId}-${userId}-${Date.now()}-${index}`,
        file.path
      );
      return secure_url;
    });
    imageUrls = await Promise.all(uploads);
  }

  // Add review
  product.reviews!.push({
    user: userId,
    review: payload.review,
    rating: payload.rating,
    images: imageUrls
  });

  // Update product average rating
  const totalRating = product.reviews!.reduce((sum: number, review: any) => sum + review.rating, 0);
  product.rating = totalRating / product.reviews!.length;

  await product.save();

  // Return the newly added review
  const newReview = product.reviews![product.reviews!.length - 1];

  return {
    success: true,
    message: "Review added successfully",
    data: newReview,
  };
};

/* Update Review */
const updateReview = async (
  productId: string,
  reviewId: string,
  userId: any,
  payload: {
    review?: string;
    rating?: number;
  },
  files: Express.Multer.File[],
  imagesToDelete?: string[] // Array of image URLs to delete
) => {
  // Find product
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  // Find the review
  const reviewIndex = product.reviews!.findIndex(
    (review: any) => review._id.toString() === reviewId && review.user.toString() === userId.toString()
  );

  if (reviewIndex === -1) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found or you are not authorized");
  }

  const review = product.reviews![reviewIndex];

  // Delete specified images from Cloudinary
  if (imagesToDelete && imagesToDelete.length > 0) {
    await Promise.all(
      imagesToDelete.map(async (imageUrl: string) => {
        const publicId = imageUrl.split("/").pop()?.split(".")[0];
        if (publicId) {
          await deleteImageFromCloudinary(publicId);
        }
      })
    );
    // Remove deleted images from review
    review.images = review.images.filter((img: string) => !imagesToDelete.includes(img));
  }

  // Upload new images
  if (files && files.length > 0) {
    const uploads = files.map(async (file, index) => {
      const { secure_url } = await sendImageToCloudinary(
        `review-${productId}-${userId}-${Date.now()}-${index}`,
        file.path
      );
      return secure_url;
    });
    const newImages = await Promise.all(uploads);
    review.images = [...review.images, ...newImages];
  }

  // Update review fields
  if (payload.review) review.review = payload.review;
  if (payload.rating) review.rating = payload.rating;

  // Update product average rating
  const totalRating = product.reviews!.reduce((sum: number, r: any) => sum + r.rating, 0);
  product.rating = totalRating / product.reviews!.length;

  await product.save();

  return {
    success: true,
    message: "Review updated successfully",
    data: review,
  };
};

/* Delete Review */
const deleteReview = async (
  productId: string,
  reviewId: string,
  userId: any
) => {
  // Find product
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  // Find the review
  const reviewIndex = product.reviews!.findIndex(
    (review: any) => review._id.toString() === reviewId && review.user.toString() === userId.toString()
  );

  if (reviewIndex === -1) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found or you are not authorized");
  }

  const review = product.reviews![reviewIndex];

  // Delete review images from Cloudinary
  if (review.images && review.images.length > 0) {
    await Promise.all(
      review.images.map(async (imageUrl: string) => {
        const publicId = imageUrl.split("/").pop()?.split(".")[0];
        if (publicId) {
          await deleteImageFromCloudinary(publicId);
        }
      })
    );
  }

  // Remove review
  product.reviews!.splice(reviewIndex, 1);

  // Update product average rating
  if (product.reviews!.length > 0) {
    const totalRating = product.reviews!.reduce((sum: number, r: any) => sum + r.rating, 0);
    product.rating = totalRating / product.reviews!.length;
  } else {
    product.rating = 0;
  }

  await product.save();

  return {
    success: true,
    message: "Review deleted successfully",
  };
};


export const ProductServices = {
  addProduct,
  getAllProducts,
  getSingleProductById,
  updateProduct,
  deleteProduct,
  addReview,
  updateReview,
  deleteReview
};
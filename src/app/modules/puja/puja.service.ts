/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import Puja from "./puja.model";
import { deleteImageFromCloudinary } from "../../utils/deleteImageFromCloudinary";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { infinitePaginate } from "../../utils/infinitePaginate";
import AppError from "../../errors/AppError";

/* Add Puja */
const addPuja = async (
  userId: any,
  payload: any,
  files: Express.Multer.File[]
) => {
  let imageUrls: string[] = [];

  if (files && files.length > 0) {
    const uploads = files.map(async (file, index) => {
      const { secure_url } = await sendImageToCloudinary(
        `puja-${Date.now()}-${index}`,
        file.path
      );
      return secure_url;
    });
    imageUrls = await Promise.all(uploads);
  }

  const puja = await Puja.create({
    ...payload,
    imageUrls,
    addedBy: userId,
  });

  return puja;
};

/* Get All Pujas */
const getAllPujas = async (
  filters: any = {},
  skip = 0,
  limit = 10
) => {
  const query: any = {};

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.minPrice) {
    query.basePrice = { $gte: Number(filters.minPrice) };
  }

  if (filters.maxPrice) {
    query.basePrice = { ...query.basePrice, $lte: Number(filters.maxPrice) };
  }

  if (filters.minRating) {
    query.rating = { $gte: Number(filters.minRating) };
  }

  if (filters.keyword) {
    query.$text = {
      $search: filters.keyword,
    };
  }

  return infinitePaginate(Puja, query, skip, limit, []);
};

/* Get Single Puja */
const getSinglePujaById = async (pujaId: string) => {
  const puja = await Puja.findById(pujaId);

  if (!puja) {
    throw new AppError(httpStatus.NOT_FOUND, "Puja not found");
  }

  return puja;
};

/* Update Puja */
const updatePuja = async (
  pujaId: string,
  payload: any,
  files: Express.Multer.File[],
  imagesToDelete?: string[]
) => {
  const puja = await Puja.findById(pujaId);

  if (!puja) {
    throw new AppError(httpStatus.NOT_FOUND, "Puja not found");
  }

  let imageUrls = puja.imageUrls || [];

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
    // Remove deleted images from array
    imageUrls = imageUrls.filter((url: string) => !imagesToDelete.includes(url));
  }

  // Upload new images
  if (files && files.length > 0) {
    const uploads = files.map(async (file, index) => {
      const { secure_url } = await sendImageToCloudinary(
        `puja-${Date.now()}-${index}`,
        file.path
      );
      return secure_url;
    });
    const newImages = await Promise.all(uploads);
    imageUrls = [...imageUrls, ...newImages];
  }

  const updatedPuja = await Puja.findByIdAndUpdate(
    pujaId,
    {
      ...payload,
      imageUrls,
    },
    { new: true }
  );

  return updatedPuja;
};

/* Delete Puja */
const deletePuja = async (pujaId: string) => {
  const puja = await Puja.findById(pujaId);

  if (!puja) {
    throw new AppError(httpStatus.NOT_FOUND, "Puja not found");
  }

  // Delete all puja images from Cloudinary
  if (puja.imageUrls?.length) {
    await Promise.all(
      puja.imageUrls.map(async (url: string) => {
        const publicId = url.split("/").pop()?.split(".")[0];
        if (publicId) {
          await deleteImageFromCloudinary(publicId);
        }
      })
    );
  }

  // Delete all review images from Cloudinary
  if (puja.reviews?.length) {
    for (const review of puja.reviews) {
      if (review.images?.length) {
        await Promise.all(
          review.images.map(async (imageUrl: string) => {
            const publicId = imageUrl.split("/").pop()?.split(".")[0];
            if (publicId) {
              await deleteImageFromCloudinary(publicId);
            }
          })
        );
      }
    }
  }

  await Puja.findByIdAndDelete(pujaId);

  return true;
};

/* Add Review */
const addReview = async (
  pujaId: string,
  userId: any,
  payload: {
    review: string;
    rating: number;
  },
  files: Express.Multer.File[]
) => {
  const puja = await Puja.findById(pujaId);
  if (!puja) {
    throw new AppError(httpStatus.NOT_FOUND, "Puja not found");
  }

  // Check if user already reviewed this puja
  const existingReview = puja.reviews.find(
    (review: any) => review.user.toString() === userId.toString()
  );
  if (existingReview) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already reviewed this puja"
    );
  }

  // Upload review images
  let imageUrls: string[] = [];
  if (files && files.length > 0) {
    const uploads = files.map(async (file, index) => {
      const { secure_url } = await sendImageToCloudinary(
        `puja-review-${pujaId}-${userId}-${Date.now()}-${index}`,
        file.path
      );
      return secure_url;
    });
    imageUrls = await Promise.all(uploads);
  }

  // Add review
  puja.reviews.push({
    user: userId,
    review: payload.review,
    rating: payload.rating,
    images: imageUrls,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Update puja average rating
  const totalRating = puja.reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
  puja.rating = totalRating / puja.reviews.length;

  await puja.save();

  const newReview = puja.reviews[puja.reviews.length - 1];

  return {
    success: true,
    message: "Review added successfully",
    data: newReview,
  };
};

/* Update Review */
const updateReview = async (
  pujaId: string,
  reviewId: string,
  userId: any,
  payload: {
    review?: string;
    rating?: number;
  },
  files: Express.Multer.File[],
  imagesToDelete?: string[]
) => {
  const puja = await Puja.findById(pujaId);
  if (!puja) {
    throw new AppError(httpStatus.NOT_FOUND, "Puja not found");
  }

  const reviewIndex = puja.reviews.findIndex(
    (review: any) => review._id.toString() === reviewId && review.user.toString() === userId.toString()
  );

  if (reviewIndex === -1) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found or you are not authorized");
  }

  const review = puja.reviews[reviewIndex];

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
    review.images = review.images.filter((img: string) => !imagesToDelete.includes(img));
  }

  // Upload new images
  if (files && files.length > 0) {
    const uploads = files.map(async (file, index) => {
      const { secure_url } = await sendImageToCloudinary(
        `puja-review-${pujaId}-${userId}-${Date.now()}-${index}`,
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
  review.updatedAt = new Date();

  // Update puja average rating
  const totalRating = puja.reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
  puja.rating = totalRating / puja.reviews.length;

  await puja.save();

  return {
    success: true,
    message: "Review updated successfully",
    data: review,
  };
};

/* Delete Review */
const deleteReview = async (
  pujaId: string,
  reviewId: string,
  userId: any
) => {
  const puja = await Puja.findById(pujaId);
  if (!puja) {
    throw new AppError(httpStatus.NOT_FOUND, "Puja not found");
  }

  const reviewIndex = puja.reviews.findIndex(
    (review: any) => review._id.toString() === reviewId && review.user.toString() === userId.toString()
  );

  if (reviewIndex === -1) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found or you are not authorized");
  }

  const review = puja.reviews[reviewIndex];

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
  puja.reviews.splice(reviewIndex, 1);

  // Update puja average rating
  if (puja.reviews.length > 0) {
    const totalRating = puja.reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
    puja.rating = totalRating / puja.reviews.length;
  } else {
    puja.rating = 0;
  }

  await puja.save();

  return {
    success: true,
    message: "Review deleted successfully",
  };
};

/* Get All Reviews for a Puja */
const getPujaReviews = async (
  pujaId: string,
  skip = 0,
  limit = 10
) => {
  const puja = await Puja.findById(pujaId).select("reviews");
  if (!puja) {
    throw new AppError(httpStatus.NOT_FOUND, "Puja not found");
  }

  const reviews = puja.reviews;
  const total = reviews.length;
  const paginatedReviews = reviews.slice(skip, skip + limit);

  return {
    data: paginatedReviews,
    meta: {
      skip,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const PujaServices = {
  addPuja,
  getAllPujas,
  getSinglePujaById,
  updatePuja,
  deletePuja,
  addReview,
  updateReview,
  deleteReview,
  getPujaReviews,
};
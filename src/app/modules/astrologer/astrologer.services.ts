/* eslint-disable @typescript-eslint/no-explicit-any */
import { Accounts } from "../accounts/accounts.model";
import { Astrologer } from "./astrologer.model";
import { infinitePaginate } from "../../utils/infinitePaginate";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { TAstrologerReview } from "./astrologer.interface";
import { User } from "../users/user.model";

const getAllAstrologer = async (
  filters: {
    keyword?: string;
    identityStatus?: string;
    isProfileCompleted?: string;
    country?: string;
    gender?: string;
    areaOfPractice?: string | string[];
    consultLanguages?: string | string[];
    minRating?: string;
    sortBy?: "topRated" | "mostExperienced" | "relevance";
    userId?: string;
  } = {},
  skip = 0,
  limit = 10
) => {
  const query: any = {};

  // Search functionality (text search on name fields)
  if (filters.keyword) {
    query.$or = [
      { firstName: { $regex: filters.keyword, $options: "i" } },
      { lastName: { $regex: filters.keyword, $options: "i" } },
      { displayName: { $regex: filters.keyword, $options: "i" } },
      { bio: { $regex: filters.keyword, $options: "i" } },
    ];
  }

  // Filter by identity status (pending, approved, rejected)
  if (filters.identityStatus) {
    query["identity.status"] = filters.identityStatus;
  }

  // Filter by profile completion
  if (filters.isProfileCompleted === "true") {
    query.isProfileCompleted = true;
  } else if (filters.isProfileCompleted === "false") {
    query.isProfileCompleted = false;
  }

  // Filter by country
  if (filters.country) {
    query.country = { $regex: filters.country, $options: "i" };
  }

  // Filter by gender
  if (filters.gender) {
    query.gender = filters.gender;
  }

  // Filter by area of practice (supports array from frontend)
  if (filters.areaOfPractice) {
    const areas = Array.isArray(filters.areaOfPractice) 
      ? filters.areaOfPractice 
      : [filters.areaOfPractice];
    query.areaOfPractice = { $in: areas };
  }

  // Filter by consult languages (supports array from frontend)
  if (filters.consultLanguages) {
    const languages = Array.isArray(filters.consultLanguages) 
      ? filters.consultLanguages 
      : [filters.consultLanguages];
    query.consultLanguages = { $in: languages };
  }

  // Rating filter (e.g., rating >= 3 and rating < 4)
  if (filters.minRating) {
    const ratingValue = parseInt(filters.minRating);
    if (!isNaN(ratingValue) && ratingValue >= 1 && ratingValue <= 5) {
      query.rating = {
        $gte: ratingValue,
        $lt: ratingValue + 1
      };
    }
  }

  // Get paginated results
  const result = await infinitePaginate(
    Astrologer,
    query,
    skip,
    limit,
    []
  );

  // Convert all documents to plain objects first to remove Mongoose internal properties
  let astrologersList = result.data.map((astrologer: any) => {
    // Convert to plain object and remove internal fields
    const plain = astrologer.toObject ? astrologer.toObject() : { ...astrologer };
    return plain;
  });

  // Handle relevance sorting (requires user's intents)
  if (filters.sortBy === "relevance" && filters.userId) {
    const userAccount = await User.findOne({ accountId: filters.userId }).select("intents");
    const userIntents = userAccount?.intents || [];
    
    if (userIntents.length > 0) {
      astrologersList = astrologersList.map((astrologer: any) => {
        let relevanceScore = 0;
        
        userIntents.forEach((intent: string) => {
          if (astrologer.areaOfPractice?.some((practice: string) => 
            practice.toLowerCase().includes(intent.toLowerCase())
          )) {
            relevanceScore++;
          }
        });
        
        return {
          ...astrologer,
          relevanceScore
        };
      });
      
      astrologersList.sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);
    }
  }
  
  // Sort by top rated (highest rating first)
  else if (filters.sortBy === "topRated") {
    astrologersList.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
  }
  
  // Sort by most experienced (parse experience string to number)
  else if (filters.sortBy === "mostExperienced") {
    astrologersList.sort((a: any, b: any) => {
      const expA = parseInt(a.experience) || 0;
      const expB = parseInt(b.experience) || 0;
      return expB - expA;
    });
  }

  // Populate account details for each astrologer
  const astrologersWithAccount = await Promise.all(
    astrologersList.map(async (astrologer: any) => {
      const account = await Accounts.findById(astrologer.accountId).select(
        "_id email phoneNumber profilePicture role isSuspended suspensionReason"
      );
      return {
        ...astrologer,
        accountDetails: account ? account.toObject() : null,
      };
    })
  );

  return {
    data: astrologersWithAccount,
    meta: result.meta,
  };
};

const getSingleAstrologerById = async (astrologerId: string) => {
  const astrologer = await Astrologer.findById(astrologerId);

  if (!astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
  }

  // Get account details
  const account = await Accounts.findById(astrologer.accountId).select(
    "_id email phoneNumber profilePicture role isSuspended suspensionReason"
  );

  return {
    ...astrologer.toObject(),
    accountDetails: account,
  };
};

const updateIdentityStatus = async (
  astrologerId: string,
  payload: {
    status: "approved" | "rejected";
    rejectedReason?: string;
  }
) => {
  const astrologer = await Astrologer.findById(astrologerId);

  if (!astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
  }

  // Update identity status
  astrologer.identity.status = payload.status;
  if (payload.status === "rejected" && payload.rejectedReason) {
    astrologer.identity.rejectedReason = payload.rejectedReason;
  }

  // Set identity verified flag
  if (payload.status === "approved") {
    astrologer.isIdentityVerified = true;
    astrologer.identity.rejectedReason = null;
  } else {
    astrologer.isIdentityVerified = false;
  }

  await astrologer.save();

  return {
    success: true,
    message: `Identity ${payload.status === "approved" ? "approved" : "rejected"} successfully`,
    data: {
      astrologerId: astrologer._id,
      identityStatus: astrologer.identity.status,
      isIdentityVerified: astrologer.isIdentityVerified,
    },
  };
};

const getPendingIdentityRequests = async (
  skip = 0,
  limit = 10
) => {
  const query = { "identity.status": "pending" };

  const result = await infinitePaginate(
    Astrologer,
    query,
    skip,
    limit,
    []
  );

  // Populate account details
  const astrologersWithAccount = await Promise.all(
    result.data.map(async (astrologer: any) => {
      const account = await Accounts.findById(astrologer.accountId).select(
        "firstName lastName email phoneNumber profilePicture"
      );
      return {
        ...astrologer.toObject(),
        accountDetails: account,
      };
    })
  );

  return {
    data: astrologersWithAccount,
    meta: result.meta,
  };
};

/* Add Review */
const addReview = async (
  astrologerId: string,
  userId: string,
  payload: {
    review: string;
    rating: number;
  }
) => {
  // Validate rating (1-5)
  if (payload.rating < 1 || payload.rating > 5) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Rating must be between 1 and 5"
    );
  }

  // Find astrologer
  const astrologer = await Astrologer.findById(astrologerId);
  if (!astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
  }

  // Check if user already reviewed this astrologer
  const existingReviewIndex = astrologer.reviews?.findIndex(
    (review:TAstrologerReview) => review.user.toString() === userId
  );

  if (existingReviewIndex !== undefined && existingReviewIndex !== -1) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already reviewed this astrologer. You can update your review instead."
    );
  }

  // Add new review
  const newReview = {
    user: userId as any,
    review: payload.review,
    rating: payload.rating,
  };

  if (!astrologer.reviews) {
    astrologer.reviews = [];
  }
  astrologer.reviews.push(newReview);

  // Calculate new average rating
  const totalRating = astrologer.reviews.reduce((sum: number, rev: TAstrologerReview) => sum + rev.rating, 0);
  astrologer.rating = totalRating / astrologer.reviews.length;

  await astrologer.save();

  return {
    success: true,
    message: "Review added successfully",
    data: {
      review: newReview,
      averageRating: astrologer.rating,
      totalReviews: astrologer.reviews.length,
    },
  };
};

/* Update Review */
const updateReview = async (
  astrologerId: string,
  userId: string,
  payload: {
    review?: string;
    rating?: number;
  }
) => {
  // Validate rating if provided
  if (payload.rating && (payload.rating < 1 || payload.rating > 5)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Rating must be between 1 and 5"
    );
  }

  // Find astrologer
  const astrologer = await Astrologer.findById(astrologerId);
  if (!astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
  }

  // Find the review index
  const reviewIndex = astrologer.reviews?.findIndex(
    (review:TAstrologerReview) => review.user.toString() === userId
  );

  if (reviewIndex === undefined || reviewIndex === -1) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  // Update review
  const review = astrologer.reviews[reviewIndex];
  if (payload.review) review.review = payload.review;
  if (payload.rating) review.rating = payload.rating;
  review.updatedAt = new Date();

  // Recalculate average rating
  const totalRating = astrologer.reviews.reduce((sum: number, rev: TAstrologerReview) => sum + rev.rating, 0);
  astrologer.rating = totalRating / astrologer.reviews.length;

  await astrologer.save();

  return {
    success: true,
    message: "Review updated successfully",
    data: {
      review,
      averageRating: astrologer.rating,
      totalReviews: astrologer.reviews.length,
    },
  };
};

/* Delete Review */
const deleteReview = async (
  astrologerId: string,
  userId: string
) => {
  // Find astrologer
  const astrologer = await Astrologer.findById(astrologerId);
  if (!astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
  }

  // Find the review index
  const reviewIndex = astrologer.reviews?.findIndex(
    (review: TAstrologerReview) => review.user.toString() === userId
  );

  if (reviewIndex === undefined || reviewIndex === -1) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found");
  }

  // Remove review
  astrologer.reviews?.splice(reviewIndex, 1);

  // Recalculate average rating (or set to 0 if no reviews)
  if (astrologer.reviews && astrologer.reviews.length > 0) {
    const totalRating = astrologer.reviews.reduce((sum: number, rev: TAstrologerReview) => sum + rev.rating, 0);
    astrologer.rating = totalRating / astrologer.reviews.length;
  } else {
    astrologer.rating = 0;
  }

  await astrologer.save();

  return {
    success: true,
    message: "Review deleted successfully",
    data: {
      averageRating: astrologer.rating,
      totalReviews: astrologer.reviews?.length || 0,
    },
  };
};


export const AstrologerServices = {
  getAllAstrologer,
  getSingleAstrologerById,
  updateIdentityStatus,
  getPendingIdentityRequests,
  addReview,
  updateReview,
  deleteReview,
};
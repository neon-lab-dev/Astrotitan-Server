/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import Consultation from "./consultation.model";
import { Astrologer } from "../../astrologer/astrologer.model";
import AppError from "../../../errors/AppError";
import { sendSingleNotification } from "../../../utils/sendSingleNotification";
import { infinitePaginate } from "../../../utils/infinitePaginate";
import { User } from "../../users/user.model";

const requestConsultation = async (
  accountId: string, // This is Account ID
  payload: {
    astrologer: string; // This is Account ID
    method: "chat" | "call";
    consultationFor: string;
    requestMessage?: string;
  }
) => {
  // Check if user exists in Accounts
  const user = await User.findOne({ accountId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Check if astrologer exists in Accounts
  const astrologer = await Astrologer.findById(payload.astrologer);
  if (!astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
  }

  // Check if there's already a pending consultation
  const existingConsultation = await Consultation.findOne({
    user: user?._id,
    astrologer: payload.astrologer,
    status: "pending",
  });

  if (existingConsultation) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You already have a pending consultation request with this astrologer"
    );
  }

  // Create consultation with Account IDs
  const consultation = await Consultation.create({
    user: user?._id,
    astrologer: payload.astrologer,
    method: payload.method,
    consultationFor: payload.consultationFor,
    requestMessage: payload.requestMessage,
    status: "pending",
  });

  // Populate with Account details
  const populatedConsultation = await Consultation.findById(consultation._id)
    .populate("user", "firstName lastName email profilePicture")
    .populate("astrologer", "firstName lastName displayName profilePicture");

  await sendSingleNotification(
    accountId as any,
    "Consultation Request Sent Successfully",
    `Your consultation request with ${astrologer?.displayName} has been sent successfully. You will be notified once they accept your request.`
  );

  return populatedConsultation;
};

/* Get My Consultation Requests - User */
const getMyConsultationRequests = async (
  accountId: string,
  filters: {
    status?: string;
  } = {},
  skip = 0,
  limit = 10
) => {
  // Find the actual User document using accountId
  const user = await User.findOne({ accountId: accountId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Use the User's _id for the query
  const query: any = { user: user._id };

  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }

  const result = await infinitePaginate(
    Consultation,
    query,
    skip,
    limit,
    [
      {
        path: "user",
        select: "firstName lastName fullName profilePicture accountId"
      },
      {
        path: "astrologer",
        select: "firstName lastName displayName profilePicture accountId"
      }
    ]
  );

  return result;
};

/* Get My Consultation Bookings - Astrologer */
const getMyConsultationBookings = async (
  accountId: string,
  filters: {
    status?: string;
    method?: string;
  } = {},
  skip = 0,
  limit = 10
) => {
  const astrologer = await Astrologer.findOne({ accountId });

  if (!astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
  }
  // Use Account ID directly - no need to find Astrologer
  const query: any = { astrologer: astrologer?._id };


  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }

  if (filters.method && filters.method !== "all") {
    query.method = filters.method;
  }

  const result = await infinitePaginate(
    Consultation,
    query,
    skip,
    limit,
    [
      {
        path: "user",
        select: "firstName lastName fullName email profilePicture accountId"
      },
      {
        path: "astrologer",
        select: "firstName lastName displayName profilePicture accountId"
      }

    ]
  );

  return result;
};

/* Change Consultation Status - Astrologer */
const changeConsultationStatus = async (
  consultationId: string,
  accountId: string, // This is Account ID
  payload: {
    status: "accepted" | "declined";
  }
) => {
  const astrologer = await Astrologer.findOne({ accountId });

  if (!astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
  }

  // Find consultation using Account ID directly
  const consultation = await Consultation.findOne({
    _id: consultationId,
    astrologer: astrologer._id,
  }).populate("user", "accountId");

  if (!consultation) {
    throw new AppError(httpStatus.NOT_FOUND, "Consultation not found or you are not authorized");
  }

  // Check if consultation is already handled
  if (consultation.status !== "pending") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `This consultation is already ${consultation.status}`
    );
  }

  // Update status
  const updateData: any = {
    status: payload.status,
  };

  if (payload.status === "accepted") {
    updateData.acceptedAt = new Date();
    updateData.startedAt = new Date();
    await sendSingleNotification(
      (consultation?.user as any)?.accountId as any,
      "Consultation Accepted!",
      `Great news! Your consultation request with ${astrologer?.displayName} has been ACCEPTED. You can now start your session and get the guidance you seek.`
    );
  }

  if (payload.status === "declined") {
    updateData.declinedAt = new Date();
    await sendSingleNotification(
      (consultation?.user as any)?.accountId as any,
      "Consultation Declined",
      `We're sorry, but ${astrologer?.displayName} is currently unavailable for your consultation. Please try another astrologer who can assist you on your spiritual journey.`
    );
  }

  const updatedConsultation = await Consultation.findByIdAndUpdate(
    consultationId,
    updateData,
    { new: true }
  )
    .populate("user", "firstName lastName email profilePicture")
    .populate("astrologer", "firstName lastName displayName profilePicture");

  return updatedConsultation;
};

/* Get Single Consultation */
const getSingleConsultation = async (
  consultationId: string,
  accountId: string
) => {
  const astrologer = await Astrologer.findOne({ accountId });
  const user = await User.findOne({ accountId });

  if (!user && !astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "User or astrologer not found");
  }
  const consultation = await Consultation.findOne({
    _id: consultationId,
    $or: [{ user: user?._id }, { astrologer: astrologer?._id }],
  })
    .populate("user")
    .populate("astrologer");

  if (!consultation) {
    throw new AppError(httpStatus.NOT_FOUND, "Consultation not found");
  }

  return consultation;
};


const endConsultationSession = async (consultationId: string,
  accountId: string,) => {
  const consultation = await Consultation.findById(consultationId);

  if (!consultation) {
    throw new AppError(httpStatus.NOT_FOUND, "Consultation not found");
  };
  const result = await Consultation.findOneAndUpdate(
    { _id: consultationId },
    { status: "ended", endedBy: accountId },
    { new: true }
  );
  return result;
}

/* Add Review for Consultation */
const addReview = async (
  consultationId: string,
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

  const user = await User.findOne({ accountId: userId });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Find consultation and check if it belongs to the user
  const consultation = await Consultation.findOne({
    _id: consultationId,
    user: user?._id,
    status: "ended",
  }).populate("astrologer", "accountId")
    .populate("user", "fullName");

  if (!consultation) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Consultation not found or not ended yet. You can only review ended consultations."
    );
  }

  // Check if review already exists for this consultation
  if (consultation.review && consultation.rating) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already reviewed this consultation"
    );
  }

  // Update consultation with review
  consultation.review = payload.review;
  consultation.rating = payload.rating;
  await consultation.save();

  // Find the astrologer
  const astrologer = await Astrologer.findById(consultation.astrologer);
  if (!astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
  }

  // Check if user already reviewed this astrologer
  const existingReviewIndex = astrologer.reviews?.findIndex(
    (review: any) => review.user.toString() === userId
  );

  if (existingReviewIndex !== undefined && existingReviewIndex !== -1) {
    // Update existing review
    astrologer.reviews[existingReviewIndex].review = payload.review;
    astrologer.reviews[existingReviewIndex].rating = payload.rating;
  } else {
    // Add new review to astrologer
    if (!astrologer.reviews) {
      astrologer.reviews = [];
    }
    astrologer.reviews.push({
      user: user?._id as any,
      review: payload.review,
      rating: payload.rating,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Recalculate average rating
  const totalRating = astrologer.reviews.reduce((sum: number, rev: any) => sum + rev.rating, 0);
  astrologer.rating = totalRating / astrologer.reviews.length;

  await astrologer.save();

  // Populate consultation with user and astrologer details
  const updatedConsultation = await Consultation.findById(consultationId)
    .populate("user", "firstName lastName email profilePicture")
    .populate("astrologer", "firstName lastName displayName profilePicture");


  await sendSingleNotification(
    (consultation?.astrologer as any)?.accountId as any,
    `${(consultation?.user as any)?.fullName} has left a review for you with rating ${payload.rating}`,
    payload?.review
  );

  return {
    success: true,
    message: "Review added successfully",
    data: {
      consultation: updatedConsultation,
      astrologerRating: astrologer.rating,
      totalReviews: astrologer.reviews.length,
    },
  };
};


export const ConsultationServices = {
  requestConsultation,
  getMyConsultationBookings,
  getMyConsultationRequests,
  changeConsultationStatus,
  getSingleConsultation,
  endConsultationSession,
  addReview
};
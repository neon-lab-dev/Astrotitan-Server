/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import Consultation from "./consultation.model";
import { Astrologer } from "../../astrologer/astrologer.model";
import AppError from "../../../errors/AppError";
import { sendSingleNotification } from "../../../utils/sendSingleNotification";
import { infinitePaginate } from "../../../utils/infinitePaginate";
import { User } from "../../users/user.model";
import { Accounts } from "../../accounts/accounts.model";

const requestConsultation = async (
  userId: string, // This is Account ID
  payload: {
    astrologer: string; // This is Account ID
    method: "chat" | "call";
    consultationFor: string;
    requestMessage?: string;
  }
) => {
  // ✅ Check if user exists in Accounts
  const user = await Accounts.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // ✅ Check if astrologer exists in Accounts
  const astrologer = await Accounts.findById(payload.astrologer);
  if (!astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
  }

  // ✅ Check if astrologer has an Astrologer profile
  const astrologerProfile = await Astrologer.findOne({ accountId: payload.astrologer });
  if (!astrologerProfile) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer profile not found");
  }

  // Check if there's already a pending consultation
  const existingConsultation = await Consultation.findOne({
    user: userId,
    astrologer: payload.astrologer,
    status: "pending",
  });

  if (existingConsultation) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You already have a pending consultation request with this astrologer"
    );
  }

  // ✅ Create consultation with Account IDs
  const consultation = await Consultation.create({
    user: userId,           // Account ID
    astrologer: payload.astrologer, // Account ID
    method: payload.method,
    consultationFor: payload.consultationFor,
    requestMessage: payload.requestMessage,
    status: "pending",
  });

  // Populate with Account details
  const populatedConsultation = await Consultation.findById(consultation._id)
    .populate("user", "firstName lastName email profilePicture")
    .populate("astrologer", "firstName lastName displayName profilePicture");

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
    // ✅ Use Account ID directly - no need to find User
    const query: any = { user: accountId };

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
                select: "firstName lastName email profilePicture"
            },
            {
                path: "astrologer",
                select: "firstName lastName displayName profilePicture"
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
    } = {},
    skip = 0,
    limit = 10
) => {
    // ✅ Use Account ID directly - no need to find Astrologer
    const query: any = { astrologer: accountId };

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
                select: "firstName lastName email profilePicture"
            },
            {
                path: "astrologer",
                select: "firstName lastName displayName profilePicture"
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
  // Find consultation using Account ID directly
  const consultation = await Consultation.findOne({
    _id: consultationId,
    astrologer: accountId, // ✅ Use Account ID directly
  });

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

  // ✅ Store user ID before updating (for notification)
  const userId = (consultation.user as any).accountId;

  // Update status
  const updateData: any = {
    status: payload.status,
  };

  if (payload.status === "accepted") {
    updateData.acceptedAt = new Date();
    updateData.startedAt = new Date();
  }

  if (payload.status === "declined") {
    updateData.declinedAt = new Date();
  }

  const updatedConsultation = await Consultation.findByIdAndUpdate(
    consultationId,
    updateData,
    { new: true }
  )
    .populate("user", "firstName lastName email profilePicture")
    .populate("astrologer", "firstName lastName displayName profilePicture");

  // ✅ Send notification to user using stored userId
  // const statusMessage =
  //   payload.status === "accepted"
  //     ? "accepted your consultation request"
  //     : "declined your consultation request";

  await sendSingleNotification(
    userId,
    `Consultation ${payload.status === "accepted" ? "Accepted" : "Declined"}`,
    `Your consultation request has been ${payload.status} by the astrologer.`
  );

  return updatedConsultation;
};
/* Get Single Consultation */
const getSingleConsultation = async (
    consultationId: string,
    accountId: string
) => {
    const astrologer = await Astrologer.findOne({ accountId });

    if (!astrologer) {
        throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
    }
    const user = await User.findOne({ accountId });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }
    const consultation = await Consultation.findOne({
        _id: consultationId,
        $or: [{ user: user?._id }, { astrologer: astrologer?._id }],
    })
        .populate("user", "firstName lastName email profilePicture")
        .populate("astrologer", "firstName lastName displayName profilePicture");

    if (!consultation) {
        throw new AppError(httpStatus.NOT_FOUND, "Consultation not found");
    }

    return consultation;
};

export const ConsultationServices = {
    requestConsultation,
    getMyConsultationBookings,
    getMyConsultationRequests,
    changeConsultationStatus,
    getSingleConsultation,
};
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import Consultation from "./consultation.model";
import { Astrologer } from "../../astrologer/astrologer.model";
import AppError from "../../../errors/AppError";
import { sendSingleNotification } from "../../../utils/sendSingleNotification";
import { infinitePaginate } from "../../../utils/infinitePaginate";
import { User } from "../../users/user.model";

/* Request Consultation - User */
const requestConsultation = async (
    userId: string,
    payload: {
        astrologer: string;
        method: "chat" | "call";
        consultationFor: string;
        requestMessage?: string;
    }
) => {
    // Check if astrologer exists
    const astrologer = await Astrologer.findById(payload.astrologer);
    if (!astrologer) {
        throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
    }

    // Check if user exists
    const user = await User.findOne({ accountId: userId });
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    // Check if there's already a pending consultation with this astrologer
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

    // Create consultation
    const consultation = await Consultation.create({
        user: user?._id,
        astrologer: payload.astrologer,
        method: payload.method,
        consultationFor: payload.consultationFor,
        status: "pending",
    });

    // Populate user and astrologer details
    const populatedConsultation = await Consultation.findById(consultation._id)
        .populate("user", "firstName lastName email profilePicture")
        .populate("astrologer", "firstName lastName displayName profilePicture");

    // Send notification to astrologer
    await sendSingleNotification(
        payload.astrologer as any,
        "New Consultation Request 📩",
        `You have a new consultation request from ${(user as any).firstName || "a user"}. Please check your dashboard.`
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
    const user = await User.findOne({ accountId: accountId });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

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
                select: "firstName lastName accountId profilePicture"
            },
            {
                path: "astrologer",
                select: "firstName lastName accountId displayName profilePicture"
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
    const astrologer = await Astrologer.findOne({ accountId: accountId });

    if (!astrologer) {
        throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
    }
    const query: any = { astrologer: astrologer?._id };

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
                select: "firstName lastName accountId profilePicture"
            }
        ]
    );

    return result;
};

/* Change Consultation Status - Astrologer */
const changeConsultationStatus = async (
    consultationId: string,
    accountId: string,
    payload: {
        status: "accepted" | "declined";
    }
) => {
    // Find consultation
    const consultation = await Consultation.findById(consultationId);

    if (!consultation) {
        throw new AppError(httpStatus.NOT_FOUND, "Consultation not found");
    }
    const astrologer = await Astrologer.findOne({ accountId });

    if (!astrologer) {
        throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
    }

    // Check if astrologer is the owner
    if (consultation.astrologer.toString() !== astrologer?._id.toString()) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Something went wrong."
        );
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

    await sendSingleNotification(
        consultation.user as any,
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
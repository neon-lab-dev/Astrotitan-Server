/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import Consultation from "./consultation.model";
import { Astrologer } from "../../astrologer/astrologer.model";
import AppError from "../../../errors/AppError";
import { Accounts } from "../../accounts/accounts.model";
import { sendSingleNotification } from "../../../utils/sendSingleNotification";
import { infinitePaginate } from "../../../utils/infinitePaginate";

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
    const astrologer = await Astrologer.findOne({ accountId: payload.astrologer });
    if (!astrologer) {
        throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
    }

    // Check if user exists
    const user = await Accounts.findById(userId);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    // Check if there's already a pending consultation with this astrologer
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

    // Create consultation
    const consultation = await Consultation.create({
        user: userId,
        astrologer: payload.astrologer,
        method: payload.method,
        consultationFor: payload.consultationFor,
        requestMessage: payload.requestMessage,
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

/* Get My Consultation Bookings - Astrologer */
const getMyConsultationBookings = async (
    astrologerId: string,
    filters: {
        status?: string;
    } = {},
    skip = 0,
    limit = 10
) => {
    const query: any = { astrologer: astrologerId };

    if (filters.status && filters.status !== "all") {
        query.status = filters.status;
    }

    const result = await infinitePaginate(
        Consultation,
        query,
        skip,
        limit,
        ["user", "astrologer"]
    );

    return result;
};

/* Get My Consultation Requests - User */
const getMyConsultationRequests = async (
    userId: string,
    filters: {
        status?: string;
    } = {},
    skip = 0,
    limit = 10
) => {
    const query: any = { user: userId };

    if (filters.status && filters.status !== "all") {
        query.status = filters.status;
    }

    const result = await infinitePaginate(
        Consultation,
        query,
        skip,
        limit,
        ["user", "astrologer"]
    );

    return result;
};

/* Change Consultation Status - Astrologer */
const changeConsultationStatus = async (
    consultationId: string,
    astrologerId: string,
    payload: {
        status: "accepted" | "declined";
    }
) => {
    // Find consultation
    const consultation = await Consultation.findById(consultationId);

    if (!consultation) {
        throw new AppError(httpStatus.NOT_FOUND, "Consultation not found");
    }

    // Check if astrologer is the owner
    if (consultation.astrologer.toString() !== astrologerId) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You are not authorized to update this consultation"
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
    userId: string
) => {
    const consultation = await Consultation.findOne({
        _id: consultationId,
        $or: [{ user: userId }, { astrologer: userId }],
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
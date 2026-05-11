/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { PujaBooking } from "./pujaBooking.model";
import AppError from "../../errors/AppError";
import { infinitePaginate } from "../../utils/infinitePaginate";
import Puja from "../puja/puja.model";
import { sendSingleNotification } from "../../utils/sendSingleNotification";
import { User } from "../users/user.model";

/* User: Book a Puja */
const bookPuja = async (
  userId: string,
  payload: {
    name: string;
    phoneNumber: string;
    pujaId: string;
    preferredDate: Date;
    purposeOfPuja: string;
  }
) => {
  // Check if puja exists
  const puja = await Puja.findById(payload.pujaId);
  if (!puja) {
    throw new AppError(httpStatus.NOT_FOUND, "Puja not found");
  }

  const user = await User.findOne({ accountId: userId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
  // Create booking
  const booking = await PujaBooking.create({
    userId : user?._id,
    name: payload.name,
    phoneNumber: payload.phoneNumber,
    pujaId: payload.pujaId,
    preferredDate: payload.preferredDate,
    purposeOfPuja: payload.purposeOfPuja,
    status: "pending",
  });

  // Send notification to user
  await sendSingleNotification(
    userId as any,
    "Puja Booking Request Received 🙏",
    `We have received your booking request for "${puja.name}" on ${new Date(payload.preferredDate).toLocaleDateString()}. Our team will contact you shortly to confirm the booking.`
  );

  // Populate puja details for response
  const bookingWithPuja = await PujaBooking.findById(booking._id).populate("pujaId", "name category price");

  return bookingWithPuja;
};

/* User: Get My Bookings */
const getMyBookings = async (
  userId: string,
  filters: {
    status?: string;
  } = {},
  skip = 0,
  limit = 10
) => {
  const query: any = { userId };

  // Status filter
  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }

  const result = await infinitePaginate(
    PujaBooking,
    query,
    skip,
    limit,
    []
  );

  return result;
};

/* User: Get Single Booking */
const getSingleBooking = async (bookingId: string, userId: string) => {
  const booking = await PujaBooking.findOne({ _id: bookingId, userId });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  return booking;
};

/* Admin: Get All Bookings */
const getAllBookings = async (
  filters: {
    status?: string;
    pujaId?: string;
  } = {},
  skip = 0,
  limit = 10
) => {
  const query: any = {};

  // Status filter
  if (filters.status) {
    query.status = filters.status;
  }

  // Puja ID filter
  if (filters.pujaId) {
    query.pujaId = filters.pujaId;
  }

  const result = await infinitePaginate(
    PujaBooking,
    query,
    skip,
    limit,
    ["userId",]
  );

  return result;
};

/* Admin: Get Single Booking by ID */
const getSingleBookingForAdmin = async (bookingId: string) => {
  const booking = await PujaBooking.findById(bookingId)
    .populate("userId")

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  return booking;
};

/* Admin: Update Booking Status with Admin Notes */
const updateBookingStatus = async (
  bookingId: string,
  payload: {
    status: "pending" | "contacted" | "booked" | "notInterested";
    adminNotes?: string;
  }
) => {
  const booking = await PujaBooking.findById(bookingId);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  const oldStatus = booking.status;
  const newStatus = payload.status;

  // Update booking
  booking.status = payload.status;
  if (payload.adminNotes) {
    booking.adminNotes = payload.adminNotes;
  }
  await booking.save();

  // Send notification based on status change
  let notificationTitle = "";
  let notificationMessage = "";

  if (oldStatus !== newStatus) {
    switch (newStatus) {
      case "contacted":
        notificationTitle = "Booking Update 📞";
        notificationMessage = `Our team has contacted you regarding your puja booking. ${payload.adminNotes ? `Note: ${payload.adminNotes}` : ""}`;
        break;
      case "booked":
        notificationTitle = "Booking Confirmed ✅";
        notificationMessage = `Your puja booking has been confirmed! ${payload.adminNotes ? `Note: ${payload.adminNotes}` : ""}`;
        break;
      case "notInterested":
        notificationTitle = "Booking Cancelled ❌";
        notificationMessage = `Your puja booking request has been cancelled. ${payload.adminNotes ? `Reason: ${payload.adminNotes}` : ""}`;
        break;
      default:
        notificationTitle = "Booking Status Updated";
        notificationMessage = `Your puja booking status has been updated to ${newStatus}.`;
    }

    // Send notification to user
    if (notificationTitle) {
      await sendSingleNotification(
        booking.userId as any,
        notificationTitle,
        notificationMessage
      );
    }
  }

  const updatedBooking = await PujaBooking.findById(bookingId);

  return updatedBooking;
};

/* Admin: Delete Puja Booking */
const deleteBooking = async (bookingId: string) => {
  const booking = await PujaBooking.findById(bookingId);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  await PujaBooking.findByIdAndDelete(bookingId);

  return { message: "Booking deleted successfully" };
};

export const PujaBookingServices = {
  bookPuja,
  getMyBookings,
  getSingleBooking,
  getAllBookings,
  getSingleBookingForAdmin,
  updateBookingStatus,
  deleteBooking,
};
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PujaBookingServices } from "./pujaBooking.service";

/* User: Book a Puja */
const bookPuja = catchAsync(async (req, res) => {
  const userId = req.user._id;
  console.log(req.user);
  const result = await PujaBookingServices.bookPuja(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Puja booking request submitted successfully",
    data: result,
  });
});

/* User: Get My Bookings */
const getMyBookings = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { status, skip = "0", limit = "10" } = req.query;

  const filters = {
    status: status as string,
  };

  const result = await PujaBookingServices.getMyBookings(
    userId,
    filters,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your bookings fetched successfully",
    data: result,
  });
});

/* User: Get Single Booking */
const getSingleBooking = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { bookingId } = req.params;

  const result = await PujaBookingServices.getSingleBooking(bookingId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking fetched successfully",
    data: result,
  });
});

/* Admin: Get All Bookings */
const getAllBookings = catchAsync(async (req, res) => {
  const { status, pujaId, skip = "0", limit = "10" } = req.query;

  const filters = {
    status: status as string,
    pujaId: pujaId as string,
  };

  const result = await PujaBookingServices.getAllBookings(
    filters,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All bookings fetched successfully",
    data: result,
  });
});

/* Admin: Get Single Booking by ID */
const getSingleBookingForAdmin = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const result = await PujaBookingServices.getSingleBookingForAdmin(bookingId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking fetched successfully",
    data: result,
  });
});

/* Admin: Update Booking Status */
const updateBookingStatus = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const result = await PujaBookingServices.updateBookingStatus(bookingId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking status updated successfully",
    data: result,
  });
});

/* Admin: Delete Booking */
const deleteBooking = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const result = await PujaBookingServices.deleteBooking(bookingId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking deleted successfully",
    data: result,
  });
});

export const PujaBookingControllers = {
  bookPuja,
  getMyBookings,
  getSingleBooking,
  getAllBookings,
  getSingleBookingForAdmin,
  updateBookingStatus,
  deleteBooking,
};
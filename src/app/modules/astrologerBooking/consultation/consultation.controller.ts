/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { ConsultationServices } from "./consultation.service";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";

/* Request Consultation */
const requestConsultation = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result = await ConsultationServices.requestConsultation(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Consultation request sent successfully",
    data: result,
  });
});

/* Get My Consultation Bookings - Astrologer */
const getMyConsultationBookings = catchAsync(async (req, res) => {
  const astrologerId = req.user._id;
  const { status, skip = "0", limit = "10" } = req.query;

  const filters = {
    status: status as string,
  };

  const result = await ConsultationServices.getMyConsultationBookings(
    astrologerId,
    filters,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Consultation bookings fetched successfully",
    data: result,
  });
});

/* Get My Consultation Requests - User */
const getMyConsultationRequests = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { status, skip = "0", limit = "10" } = req.query;

  const filters = {
    status: status as string,
  };

  const result = await ConsultationServices.getMyConsultationRequests(
    userId,
    filters,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your consultation requests fetched successfully",
    data: result,
  });
});

/* Change Consultation Status - Astrologer */
const changeConsultationStatus = catchAsync(async (req, res) => {
  const astrologerId = req.user._id;
  const { consultationId } = req.params;
  const { status } = req.body;

  const result = await ConsultationServices.changeConsultationStatus(
    consultationId,
    astrologerId,
    { status }
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Consultation ${status} successfully`,
    data: result,
  });
});

/* Get Single Consultation */
const getSingleConsultation = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { consultationId } = req.params;

  const result = await ConsultationServices.getSingleConsultation(
    consultationId,
    userId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Consultation fetched successfully",
    data: result,
  });
});

export const ConsultationControllers = {
  requestConsultation,
  getMyConsultationBookings,
  getMyConsultationRequests,
  changeConsultationStatus,
  getSingleConsultation,
};
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
    message: "Your consultation request has been sent successfully. Please wait for astrologer to accept your request.",
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

/* Get My Consultation Bookings - Astrologer */
const getMyConsultationBookings = catchAsync(async (req, res) => {
  const astrologerId = req.user._id;
  const { status, method, skip = "0", limit = "10" } = req.query;

  const filters = {
    status: status as string,
    method: method as string,
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

/* Change Consultation Status - Astrologer */
const changeConsultationStatus = catchAsync(async (req, res) => {
  const accountId = req.user._id;
  const { consultationId } = req.params;
  const { status } = req.body;

  const result = await ConsultationServices.changeConsultationStatus(
    consultationId,
    accountId,
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

const endConsultationSession = catchAsync(async (req, res) => {
  const accountId = req.user._id;
  const { consultationId } = req.params;

  const result = await ConsultationServices.endConsultationSession(
    consultationId,
    accountId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Session ended successfully!",
    data: result,
  });
});

/* Add Review for Consultation */
const addReview = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { consultationId } = req.params;
  const { review, rating } = req.body;

  const result = await ConsultationServices.addReview(
    consultationId,
    userId,
    { review, rating }
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review added successfully",
    data: result.data,
  });
});

/* Schedule Meeting - Astrologer */
const scheduleMeeting = catchAsync(async (req, res) => {
  const accountId = req.user._id;
  const { consultationId } = req.params;

  const result = await ConsultationServices.scheduleMeeting(
    consultationId,
    accountId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Meeting scheduled successfully",
    data: result,
  });
});

/* Send Reschedule Request - User */
const sendRescheduleRequest = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { consultationId } = req.params;
  const { requestedTime, reason } = req.body;

  const result = await ConsultationServices.sendRescheduleRequest(
    consultationId,
    userId,
    { requestedTime: new Date(requestedTime), reason }
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reschedule request sent successfully",
    data: result,
  });
});

/* Handle Reschedule Request - Astrologer */
const rescheduleMeeting = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { consultationId } = req.params;
  const { action } = req.body;

  const result = await ConsultationServices.rescheduleMeeting(
    consultationId,
    userId,
    { action }
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Reschedule request ${action}ed successfully`,
    data: result,
  });
});

const addRecommendations = catchAsync(async (req, res) => {
    const accountId = req.user._id;
    const { consultationId } = req.params;
    const { recommendations } = req.body;

    if (!recommendations || !recommendations.trim()) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Recommendations content is required",
            data: null,
        });
    }

    const result = await ConsultationServices.addRecommendations(
        consultationId,
        accountId,
        { recommendations: recommendations.trim() }
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: result.data,
    });
});

export const ConsultationControllers = {
  requestConsultation,
  getMyConsultationBookings,
  getMyConsultationRequests,
  changeConsultationStatus,
  getSingleConsultation,
  endConsultationSession,
  addReview,
  scheduleMeeting,
  sendRescheduleRequest,
  rescheduleMeeting,
  addRecommendations,
};
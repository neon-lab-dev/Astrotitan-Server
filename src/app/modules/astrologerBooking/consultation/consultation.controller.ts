import httpStatus from "http-status";
import { ConsultationServices } from "./consultation.service";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";

// Request consultation
const requestConsultation = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const result = await ConsultationServices.requestConsultation(
    userId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message:
      "Your consultation request has been sent successfully. Please wait for astrologer to accept your request.",
    data: result,
  });
});

// Get my consultation requests - User
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

// Get my consultation bookings - Astrologer
const getMyConsultationBookings = catchAsync(async (req, res) => {
  const astrologerId = req.user._id;
  const { status, date, method, skip = "0", limit = "10" } = req.query;

  const filters = {
    status: status as string,
    method: method as string,
    date: date as string,
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

// Get all consultations - Admin
const getAllConsultations = catchAsync(async (req, res) => {
  const { status, date, method, skip = "0", limit = "10" } = req.query;

  const filters = {
    status: status as string,
    method: method as string,
    date: date as string,
  };

  const result = await ConsultationServices.getAllConsultations(
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

// Get single consultation
const getSingleConsultation = catchAsync(async (req, res) => {
  const accountId = req.user._id;
  const { consultationId } = req.params;

  const result = await ConsultationServices.getSingleConsultation(
    consultationId,
    accountId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Consultation fetched successfully",
    data: result,
  });
});

// Join consultation call - User/Astrologer
const joinConsultation = catchAsync(async (req, res) => {
  const accountId = req.user._id;
  const { consultationId } = req.params;

  const result = await ConsultationServices.joinConsultation(
    consultationId,
    accountId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Consultation call credentials generated successfully",
    data: result,
  });
});

// Start consultation - Astrologer
const startConsultation = catchAsync(async (req, res) => {
  const accountId = req.user._id;
  const { consultationId } = req.params;

  const result = await ConsultationServices.startConsultation(
    consultationId,
    accountId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Consultation started successfully",
    data: result,
  });
});

// End consultation session
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
    message: "Consultation ended successfully",
    data: result,
  });
});

// Add review for consultation
const addReview = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { consultationId } = req.params;
  const { review, rating } = req.body;

  const result = await ConsultationServices.addReview(
    consultationId,
    userId,
    {
      review,
      rating,
    }
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review added successfully",
    data: result.data,
  });
});

// Schedule consultation - Astrologer
const scheduleConsultation = catchAsync(async (req, res) => {
  const accountId = req.user._id;
  const { consultationId } = req.params;

  const result = await ConsultationServices.scheduleConsultation(
    consultationId,
    accountId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Consultation scheduled successfully",
    data: result,
  });
});

// Reject consultation - Astrologer
const rejectConsultation = catchAsync(async (req, res) => {
  const accountId = req.user._id;
  const { consultationId } = req.params;

  const result = await ConsultationServices.rejectConsultation(
    consultationId,
    accountId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Consultation rejected successfully.",
    data: result,
  });
});

// Send reschedule request - User
const sendRescheduleRequest = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { consultationId } = req.params;
  const { requestedTime, reason } = req.body;

  const result = await ConsultationServices.sendRescheduleRequest(
    consultationId,
    userId,
    {
      requestedTime: new Date(requestedTime),
      reason,
    }
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reschedule request sent successfully",
    data: result,
  });
});

// Handle reschedule request - Astrologer
const rescheduleConsultation = catchAsync(async (req, res) => {
  const astrologerId = req.user._id;
  const { consultationId } = req.params;
  const { action } = req.body;

  const result = await ConsultationServices.rescheduleConsultation(
    consultationId,
    astrologerId,
    { action }
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Reschedule request ${action}ed successfully`,
    data: result,
  });
});

// Add recommendations - Astrologer
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
    {
      recommendations: recommendations.trim(),
    }
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

export const ConsultationControllers = {
  getAllConsultations,
  requestConsultation,
  getMyConsultationRequests,
  getMyConsultationBookings,
  getSingleConsultation,
  scheduleConsultation,
  rejectConsultation,
  joinConsultation,
  startConsultation,
  endConsultationSession,
  addReview,
  sendRescheduleRequest,
  rescheduleConsultation,
  addRecommendations,
};
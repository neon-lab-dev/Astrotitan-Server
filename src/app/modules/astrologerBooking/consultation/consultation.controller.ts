/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { ConsultationServices } from "./consultation.service";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { generateTwilioAccessToken } from "../../../utils/twilio";

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


// Start a call
const startCall = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { consultationId } = req.body;

  const result = await ConsultationServices.startCall(
    consultationId,
    userId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Call initiated successfully',
    data: result,
  });
});

// Accept a call
const acceptCall = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { consultationId } = req.body;

  const result = await ConsultationServices.acceptCall(consultationId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Call accepted successfully',
    data: result,
  });
});

// Reject a call
const rejectCall = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { consultationId } = req.body;

  const result = await ConsultationServices.rejectCall(consultationId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Call rejected successfully',
    data: result,
  });
});

// End a call
const endCall = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { consultationId } = req.body;

  const result = await ConsultationServices.endCall(consultationId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Call ended successfully',
    data: result,
  });
});

// Get call token
const getCallToken = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { consultationId } = req.params;

  const result = await ConsultationServices.getCallToken(consultationId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Call token generated successfully',
    data: result,
  });
});

// Get call status
const getCallStatus = catchAsync(async (req, res) => {
  const { consultationId } = req.params;

  const result = await ConsultationServices.getCallStatus(consultationId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Call status fetched successfully',
    data: result,
  });
});


// Add a test endpoint in your backend
const testTwilioCredentials = catchAsync(async (req, res) => {
  try {
    // Test generating a token
    const token = generateTwilioAccessToken('test-user', 'test-room');
    
    // Decode token to check
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Twilio credentials valid",
      data: {
        tokenPreview: token.substring(0, 50) + '...',
        payload: payload,
        hasVideoGrant: !!payload.grants?.video,
        identity: payload.grants?.identity,
      },
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || "Twilio credentials invalid",
      data: null,
    });
  }
});


export const ConsultationControllers = {
  requestConsultation,
  getMyConsultationBookings,
  getMyConsultationRequests,
  changeConsultationStatus,
  getSingleConsultation,
  endConsultationSession,
  addReview,
  startCall,
  endCall,
  acceptCall,
  rejectCall,
  getCallToken,
  getCallStatus,
  testTwilioCredentials
};
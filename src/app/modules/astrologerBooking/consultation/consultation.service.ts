/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import Consultation from "./consultation.model";
import { Astrologer } from "../../astrologer/astrologer.model";
import AppError from "../../../errors/AppError";
import { sendSingleNotification } from "../../../utils/sendSingleNotification";
import { infinitePaginate } from "../../../utils/infinitePaginate";
import { User } from "../../users/user.model";
import { createRoom, endRoom, generateTwilioAccessToken } from "../../../utils/twilio";
import { io, userSocketMap } from "../../../socket";

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


const startCall = async (
  consultationId: string,
  callerId: string,
) => {
  // 1. Find consultation
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) {
    throw new AppError(httpStatus.NOT_FOUND, 'Consultation not found');
  }

  // 2. Verify consultation is accepted
  if (consultation.status !== 'accepted') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Consultation must be accepted before starting a call'
    );
  }

  const astrologer = await Astrologer.findOne({ accountId: callerId });

  const user = await User.findOne({ accountId: consultation.user });

  
  // 3. Check if caller is part of consultation
  const isUser = user?.accountId?.toString() === callerId;
  const isAstrologer = astrologer.accountId.toString() === callerId;
  console.log(callerId);
  console.log(astrologer);
  if (!isUser && !isAstrologer) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized to start a call for this consultation'
    );
  }

  // 4. Get the receiver ID
  const receiverId = isUser
    ? consultation.astrologer.toString()
    : consultation.user.toString();

  // 5. Get user details for notification
  const caller = await User.findById(callerId).select('firstName lastName');
  const callerName = caller?.firstName || 'Someone';

  // 6. Create unique room name
  const roomName = `consultation-${consultationId}-${Date.now()}`;

  // 7. Create Twilio room
  let room;
  try {
    room = await createRoom(roomName);
  } catch (error: any) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || 'Failed to create call room');
  }

  // 8. Generate tokens for both participants
  const callerToken = generateTwilioAccessToken(callerId, roomName);
  const receiverToken = generateTwilioAccessToken(receiverId, roomName);

  // 9. Update consultation
  consultation.callRoomId = roomName;
  consultation.callStatus = 'ringing';
  consultation.callStartedAt = new Date();
  await consultation.save();

  // 10. Emit incoming call event to receiver
  const receiverSocketId = userSocketMap.get(receiverId);
  if (receiverSocketId && io) {
    io.to(receiverSocketId).emit('incoming-call', {
      consultationId: consultation._id,
      callerId,
      callerName,
      roomName,
      timestamp: new Date().toISOString(),
    });
    console.log(`📞 Incoming call sent to: ${receiverId}`);
  } else {
    console.log(`⚠️ Receiver ${receiverId} is offline`);
    // You might want to handle this - send push notification
  }

  return {
    success: true,
    roomName,
    callerToken,
    receiverToken,
    message: 'Call initiated successfully',
  };
};

// Accept a call
const acceptCall = async (consultationId: string, receiverId: string) => {
  // 1. Find consultation
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) {
    throw new AppError(httpStatus.NOT_FOUND, 'Consultation not found');
  }

  // 2. Verify consultation is in ringing state
  if (consultation.callStatus !== 'ringing') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Call is not in ringing state (current: ${consultation.callStatus})`
    );
  }

  // 3. Verify receiver is part of consultation
  const isUser = consultation.user.toString() === receiverId;
  const isAstrologer = consultation.astrologer.toString() === receiverId;
  if (!isUser && !isAstrologer) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized to accept this call'
    );
  }

  // 4. Get the caller ID
  const callerId = isUser
    ? consultation.astrologer.toString()
    : consultation.user.toString();

  // 5. Update consultation
  consultation.callStatus = 'connected';
  await consultation.save();

  // 6. Generate receiver token (if not already generated)
  const roomName = consultation.callRoomId;
  const receiverToken = generateTwilioAccessToken(receiverId, roomName as string);

  // 7. Emit call accepted event to caller
  const callerSocketId = userSocketMap.get(callerId);
  if (callerSocketId && io) {
    io.to(callerSocketId).emit('call-accepted', {
      consultationId: consultation._id,
      receiverId,
      roomName,
      timestamp: new Date().toISOString(),
    });
    console.log(`📞 Call accepted by: ${receiverId}`);
  }

  return {
    success: true,
    roomName,
    receiverToken,
    message: 'Call accepted successfully',
  };
};

// Reject a call
const rejectCall = async (consultationId: string, receiverId: string) => {
  // 1. Find consultation
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) {
    throw new AppError(httpStatus.NOT_FOUND, 'Consultation not found');
  }

  // 2. Verify consultation is in ringing state
  if (consultation.callStatus !== 'ringing') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Call is not in ringing state (current: ${consultation.callStatus})`
    );
  }

  // 3. Get caller ID
  const isUser = consultation.user.toString() === receiverId;
  const callerId = isUser
    ? consultation.astrologer.toString()
    : consultation.user.toString();

  // 4. Update consultation
  consultation.callStatus = 'idle';
  await consultation.save();

  // 5. End the Twilio room if it exists
  if (consultation.callRoomId) {
    try {
      await endRoom(consultation.callRoomId);
    } catch (error) {
      console.error('Error ending room:', error);
    }
  }

  // 6. Emit call rejected event to caller
  const callerSocketId = userSocketMap.get(callerId);
  if (callerSocketId && io) {
    io.to(callerSocketId).emit('call-rejected', {
      consultationId: consultation._id,
      receiverId,
      timestamp: new Date().toISOString(),
    });
    console.log(`📞 Call rejected by: ${receiverId}`);
  }

  return {
    success: true,
    message: 'Call rejected successfully',
  };
};

// End a call (by either participant)
const endCall = async (consultationId: string, userId: string) => {
  // 1. Find consultation
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) {
    throw new AppError(httpStatus.NOT_FOUND, 'Consultation not found');
  }

  // 2. Verify user is part of consultation
  const isUser = consultation.user.toString() === userId;
  const isAstrologer = consultation.astrologer.toString() === userId;
  if (!isUser && !isAstrologer) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized to end this call'
    );
  }

  // 3. Get the other participant ID
  const otherParticipantId = isUser
    ? consultation.astrologer.toString()
    : consultation.user.toString();

  // 4. Calculate call duration
  let callDuration = 0;
  if (consultation.callStartedAt) {
    callDuration = Math.floor(
      (new Date().getTime() - consultation.callStartedAt.getTime()) / 1000
    );
  }

  // 5. Update consultation
  consultation.callStatus = 'ended';
  consultation.callEndedAt = new Date();
  // consultation.callEndedBy = isUser ? 'user' : 'astrologer';
  consultation.callDuration = callDuration;
  await consultation.save();

  // 6. End the Twilio room if it exists
  if (consultation.callRoomId) {
    try {
      await endRoom(consultation.callRoomId);
    } catch (error) {
      console.error('Error ending room:', error);
    }
  }

  // 7. Emit call ended event to both participants
  const participants = [userId, otherParticipantId];
  participants.forEach((participantId) => {
    const socketId = userSocketMap.get(participantId);
    if (socketId && io) {
      io.to(socketId).emit('call-ended', {
        consultationId: consultation._id,
        endedBy: userId,
        duration: callDuration,
        timestamp: new Date().toISOString(),
      });
    }
  });

  console.log(`📞 Call ended by: ${userId} (Duration: ${callDuration}s)`);

  return {
    success: true,
    duration: callDuration,
    message: 'Call ended successfully',
  };
};

// Get call token for joining an existing call
const getCallToken = async (consultationId: string, userId: string) => {
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) {
    throw new AppError(httpStatus.NOT_FOUND, 'Consultation not found');
  }

  // Verify user is part of consultation
  const isUser = consultation.user.toString() === userId;
  const isAstrologer = consultation.astrologer.toString() === userId;
  if (!isUser && !isAstrologer) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized to join this call'
    );
  }

  // Verify call is in connected state
  if (consultation.callStatus !== 'connected') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Call is not in connected state (current: ${consultation.callStatus})`
    );
  }

  const roomName = consultation.callRoomId;
  if (!roomName) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'No active call room found for this consultation'
    );
  }

  const token = generateTwilioAccessToken(userId, roomName);

  return {
    success: true,
    roomName,
    token,
    callType: 'audio', // or 'video' based on your implementation
  };
};

// Get call status
const getCallStatus = async (consultationId: string) => {
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) {
    throw new AppError(httpStatus.NOT_FOUND, 'Consultation not found');
  }

  return {
    status: consultation.callStatus,
    roomId: consultation.callRoomId,
    startedAt: consultation.callStartedAt,
    duration: consultation.callDuration,
  };
};


export const ConsultationServices = {
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


};
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import Consultation from "./consultation.model";
import { Astrologer } from "../../astrologer/astrologer.model";
import AppError from "../../../errors/AppError";
import { sendSingleNotification } from "../../../utils/sendSingleNotification";
import { infinitePaginate } from "../../../utils/infinitePaginate";
import { User } from "../../users/user.model";
import googleCalendarService from "../googleCalendar/googleCalendar.service";
import Slot from "../../astrologer/slot/slot.model";

const requestConsultation = async (
  accountId: string, // This is Account ID
  payload: {
    astrologer: string; // This is Account ID
    method: "chat" | "call";
    consultationFor: string;
    requestMessage?: string;
    slotId?: string; // Only for call
  }
) => {
  // 1. Check if user exists
  const user = await User.findOne({ accountId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // 2. Check if astrologer exists
  const astrologer = await Astrologer.findById(payload.astrologer);
  if (!astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
  }

  // 3. Check if there's already a pending consultation
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

  // 4. If method is "call" and slotId is provided, verify and book the slot
  let slotDoc: any = null;
  let slotIndex = -1;
  let slotList: Array<{ _id: { toString: () => string }; isBooked: boolean }> = [];

  if (payload.method === "call" && payload.slotId) {
    // Find the slot document
    slotDoc = await Slot.findOne({
      astrologerId: payload.astrologer,
      "slots._id": payload.slotId,
    });

    if (!slotDoc) {
      throw new AppError(httpStatus.NOT_FOUND, "Slot not found");
    }

    slotList = Array.isArray(slotDoc.slots)
      ? (slotDoc.slots as Array<{ _id: { toString: () => string }; isBooked: boolean }>)
      : [];

    // Find the specific slot
    slotIndex = slotList.findIndex(
      (slot) => slot._id.toString() === payload.slotId
    );

    if (slotIndex === -1) {
      throw new AppError(httpStatus.NOT_FOUND, "Slot not found");
    }

    // Check if slot is already booked
    if (slotList[slotIndex].isBooked) {
      throw new AppError(httpStatus.BAD_REQUEST, "This slot is already booked");
    }
  }

  // 5. Create consultation
  const consultation = await Consultation.create({
    user: user?._id,
    astrologer: payload.astrologer,
    method: payload.method,
    consultationFor: payload.consultationFor,
    requestMessage: payload.requestMessage,
    status: "pending",
    // Store slot reference if call method
    ...(payload.method === "call" && payload.slotId && {
      slotId: payload.slotId,
    }),
  });

  // 6. Mark slot as booked
  if (payload.method === "call" && payload.slotId && slotDoc && slotIndex !== -1) {
    slotDoc.slots[slotIndex].isBooked = true;
    await slotDoc.save();
  }

  // 7. Populate consultation
  const populatedConsultation = await Consultation.findById(consultation._id)
    .populate("user", "firstName lastName email profilePicture")
    .populate("astrologer", "firstName lastName displayName profilePicture");

  // 8. Send notification
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
    status: "scheduled" | "ended";
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

//Schedule a meeting for a consultation (Astrologer)
const scheduleMeeting = async (
  consultationId: string,
  accountId: string
) => {
  // 1. Find astrologer
  const astrologer = await Astrologer.findOne({ accountId }).select(
    "+googleCalendar.refreshToken +googleCalendar.accessToken +googleCalendar.tokenExpiry +googleCalendar.email +googleCalendar.calendarId +googleCalendar.isConnected"
  );
  if (!astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
  }

  // 2. Find consultation
  const consultation = await Consultation.findOne({
    _id: consultationId,
    astrologer: astrologer._id,
  }).populate("user", "firstName lastName email");

  if (!consultation) {
    throw new AppError(httpStatus.NOT_FOUND, "Consultation not found or not authorized");
  }

  // 3. Verify method is call
  if (consultation.method !== "call") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This consultation is not a call session"
    );
  }

  // 4. ✅ Check if meeting is already scheduled
  if (!consultation.meeting?.scheduledAt) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Meeting time has not been set for this consultation"
    );
  }

  // 5. ✅ Get scheduledAt from consultation
  const scheduledAt = consultation.meeting.scheduledAt;

  const DEFAULT_DURATION = 60;
  // 6. Calculate end time
  const endTime = new Date(scheduledAt);
  endTime.setMinutes(endTime.getMinutes() + DEFAULT_DURATION);

  // 7. Get user email
  const user = await User.findById(consultation.user).populate("accountId", "email");
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // 8. Create meeting in Google Calendar
  const meeting = await googleCalendarService.createMeeting(
    astrologer,
    {
      summary: `Astrology Consultation: ${consultation.consultationFor}`,
      description: `
        Consultation with ${astrologer.displayName || astrologer.firstName}
      `,
      startTime: scheduledAt,
      endTime: endTime,
      attendeeEmail: (user.accountId as any)?.email,
      timezone: 'Asia/Kolkata',
    }
  );

  // 9. Update consultation with meeting details
  consultation.meeting.link = meeting.meetLink;
  consultation.status = "scheduled";
  await consultation.save();

  // 10. Send notifications
  await sendSingleNotification(
    user.accountId as any,
    "Meeting Scheduled!",
    `Your consultation with ${astrologer.displayName} has been scheduled for ${new Date(scheduledAt).toLocaleString()}. Join via: ${meeting.meetLink}`
  );

  await sendSingleNotification(
    accountId as any,
    "Meeting Scheduled Successfully",
    `You have scheduled a meeting with ${user.firstName} for ${new Date(scheduledAt).toLocaleString()}. Meet link: ${meeting.meetLink}`
  );

  return {
    success: true,
    consultation,
    meeting: {
      link: meeting.meetLink,
      scheduledAt: scheduledAt,
      duration: DEFAULT_DURATION,
    },
  };
};

//Send reschedule request (User)
const sendRescheduleRequest = async (
  consultationId: string,
  accountId: string,
  payload: {
    requestedTime: Date;
    reason: string;
  }
) => {
  // 1. Find user
  const user = await User.findOne({ accountId });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // 2. Find consultation
  const consultation = await Consultation.findOne({
    _id: consultationId,
    user: user._id,
  }).populate("astrologer", "accountId firstName lastName displayName email");

  if (!consultation) {
    throw new AppError(httpStatus.NOT_FOUND, "Consultation not found or not authorized");
  }

  // 3. Verify consultation is scheduled
  if (consultation.status !== "scheduled") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot reschedule: consultation status is ${consultation.status}`
    );
  }

  // 4. Check if there's already a pending reschedule request
  if (consultation.meeting?.rescheduleRequest?.isRescheduled) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You already have a pending reschedule request"
    );
  }

  // 5. Add reschedule request
  consultation.meeting = {
    ...consultation.meeting,
    rescheduleRequest: {
      requestedTime: payload.requestedTime,
      reason: payload.reason,
      isRescheduled: false,
    },
  };
  await consultation.save();

  // 6. Notify astrologer
  const astrologer = await Astrologer.findById(consultation.astrologer);
  await sendSingleNotification(
    astrologer?.accountId as any,
    "Reschedule Request Received",
    `${user.firstName} has requested to reschedule the meeting. Reason: ${payload.reason}`
  );

  return {
    success: true,
    message: "Reschedule request sent successfully",
    rescheduleRequest: consultation.meeting?.rescheduleRequest,
  };
};

//Accept or reject reschedule request (Astrologer)
const rescheduleMeeting = async (
  consultationId: string,
  accountId: string,
  payload: {
    action: "accept" | "reject";
  }
) => {
  // 1. Find astrologer
  const astrologer = await Astrologer.findOne({ accountId });
  if (!astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
  }

  // 2. Find consultation
  const consultation = await Consultation.findOne({
    _id: consultationId,
    astrologer: astrologer._id,
  }).populate("user", "accountId firstName lastName email");

  if (!consultation) {
    throw new AppError(httpStatus.NOT_FOUND, "Consultation not found or not authorized");
  }

  // 3. Verify consultation is scheduled
  if (consultation.status !== "scheduled") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot reschedule: consultation status is ${consultation.status}`
    );
  }

  // 4. Verify there's a reschedule request
  if (!consultation.meeting?.rescheduleRequest) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "No reschedule request found"
    );
  }

  const rescheduleRequest = consultation.meeting.rescheduleRequest;

  // 5. Check if already processed
  if (rescheduleRequest.isRescheduled === true) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This reschedule request has already been processed"
    );
  }

  if (payload.action === "accept") {
    // 6a. Update Google Calendar event
    const newStartTime = new Date(rescheduleRequest.requestedTime!);

    // 6b. Update consultation with new meeting time
    consultation.meeting.scheduledAt = newStartTime;
    consultation.meeting.rescheduleRequest.isRescheduled = true;
    await consultation.save();

    // 6c. Notify user
    const user = await User.findById(consultation.user);
    await sendSingleNotification(
      user?.accountId as any,
      "Meeting Rescheduled",
      `Your meeting has been rescheduled to ${newStartTime.toLocaleString()}.`
    );

    return {
      success: true,
      message: "Reschedule request accepted",
      newTime: newStartTime,
    };
  } else {
    // 7. Reject reschedule
    consultation.meeting.rescheduleRequest.isRescheduled = false;
    await consultation.save();

    // 8. Notify user
    const user = await User.findById(consultation.user);
    await sendSingleNotification(
      user?.accountId as any,
      "Reschedule Request Rejected",
      "Your reschedule request was not approved. The original meeting time remains unchanged."
    );

    return {
      success: true,
      message: "Reschedule request rejected",
      originalTime: consultation.meeting.scheduledAt,
    };
  }
};

const addRecommendations = async (
  consultationId: string,
  accountId: string,
  payload: {
    recommendations: string;
  }
) => {
  // 1. Find astrologer
  const astrologer = await Astrologer.findOne({ accountId });
  if (!astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
  }

  // 2. Find consultation
  const consultation = await Consultation.findOne({
    _id: consultationId,
    astrologer: astrologer._id,
  });

  if (!consultation) {
    throw new AppError(httpStatus.NOT_FOUND, "Consultation not found or not authorized");
  }

  // 3. Verify consultation is ended
  if (consultation.status !== "ended") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Recommendations can only be added after the consultation is ended. Current status: ${consultation.status}`
    );
  }

  // 4. Update consultation with recommendations
  consultation.recommendations = payload.recommendations.trim();
  await consultation.save();

  return {
    success: true,
    message: "Recommendations added successfully",
    data: consultation,
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
  scheduleMeeting,
  sendRescheduleRequest,
  rescheduleMeeting,
  addRecommendations,
};
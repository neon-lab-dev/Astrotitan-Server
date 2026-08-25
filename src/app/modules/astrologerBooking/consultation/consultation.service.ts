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
    slotId?: string; // The Slot document ID (only for call)
    bookedSlotId?: string; // The specific slot's _id inside the slots array (only for call)
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

  // 4. If method is "call" and bookedSlotId is provided, verify and book the slot
  let slotDoc: any = null;
  let slotIndex = -1;

  if (payload.method === "call" && payload.bookedSlotId) {
    // Find the slot document that contains this bookedSlotId
    slotDoc = await Slot.findOne({
      astrologerId: payload.astrologer,
      "slots._id": payload.bookedSlotId,
    });

    if (!slotDoc) {
      throw new AppError(httpStatus.NOT_FOUND, "Slot not found");
    }

    // Find the specific slot using bookedSlotId (NOT slotId)
    slotIndex = slotDoc.slots.findIndex(
      (slot: any) => slot._id.toString() === payload.bookedSlotId
    );

    if (slotIndex === -1) {
      throw new AppError(httpStatus.NOT_FOUND, "Slot not found in the slots array");
    }

    // Check if slot is already booked
    if (slotDoc.slots[slotIndex].isBooked) {
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
    // Store both the document ID and the specific slot ID
    ...(payload.method === "call" && payload.slotId && {
      slotId: payload.slotId, // The Slot document ID
      bookedSlotId: payload.bookedSlotId, // The specific slot's _id
    }),
  });

  // 6. Mark the specific slot as booked
  if (payload.method === "call" && slotDoc && slotIndex !== -1) {
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

/* Get My Consultation Bookings - User */
const getMyConsultationRequests = async (
  accountId: string,
  filters: {
    status?: string;
    method?: string;
    date?: string; // Add date filter
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

  if (filters.method && filters.method !== "all") {
    query.method = filters.method;
  }

  // Date filter - Convert "Aug 15, 2026" to Date range
  if (filters.date) {
    const dateStr = filters.date; // "Aug 15, 2026"
    const parsedDate = new Date(dateStr);

    if (!isNaN(parsedDate.getTime())) {
      // Set start of day (00:00:00)
      const startDate = new Date(parsedDate);
      startDate.setHours(0, 0, 0, 0);

      // Set end of day (23:59:59)
      const endDate = new Date(parsedDate);
      endDate.setHours(23, 59, 59, 999);

      // Use aggregation to filter by slotId.date
      // Since we need to filter by populated field, we'll use aggregation
      const result = await getConsultationsWithDateFilter(
        query,
        startDate,
        endDate,
        skip,
        limit
      );

      return result;
    }
  }

  // If no date filter, use the regular pagination
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
      },
      {
        path: "slotId",
        select: "date slots"
      }
    ]
  );

  // Process each consultation to get the booked slot details
  if (result.data && result.data.length > 0) {
    result.data = result.data.map((consultation: any) => {
      const consultationObj = consultation.toObject ? consultation.toObject() : consultation;

      if (consultationObj.slotId && consultationObj.bookedSlotId) {
        const bookedSlot = consultationObj.slotId.slots?.find(
          (slot: any) => slot._id.toString() === consultationObj.bookedSlotId.toString()
        );

        consultationObj.bookedSlot = bookedSlot || null;

        if (bookedSlot) {
          consultationObj.startTime = bookedSlot.startTime;
          consultationObj.endTime = bookedSlot.endTime;
        }
      } else {
        consultationObj.bookedSlot = null;
      }

      return consultationObj;
    });
  }

  return result;
};

/* Get My Consultation Bookings - Astrologer */
const getMyConsultationBookings = async (
  accountId: string,
  filters: {
    status?: string;
    method?: string;
    date?: string; // Add date filter
  } = {},
  skip = 0,
  limit = 10
) => {
  const astrologer = await Astrologer.findOne({ accountId });

  if (!astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
  }

  const query: any = { astrologer: astrologer?._id };

  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }

  if (filters.method && filters.method !== "all") {
    query.method = filters.method;
  }

  // Date filter - Convert "Aug 15, 2026" to Date range
  if (filters.date) {
    const dateStr = filters.date; // "Aug 15, 2026"
    const parsedDate = new Date(dateStr);

    if (!isNaN(parsedDate.getTime())) {
      // Set start of day (00:00:00)
      const startDate = new Date(parsedDate);
      startDate.setHours(0, 0, 0, 0);

      // Set end of day (23:59:59)
      const endDate = new Date(parsedDate);
      endDate.setHours(23, 59, 59, 999);

      // Use aggregation to filter by slotId.date
      // Since we need to filter by populated field, we'll use aggregation
      const result = await getConsultationsWithDateFilter(
        query,
        startDate,
        endDate,
        skip,
        limit
      );

      return result;
    }
  }

  // If no date filter, use the regular pagination
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
      },
      {
        path: "slotId",
        select: "date slots"
      }
    ]
  );

  // Process each consultation to get the booked slot details
  if (result.data && result.data.length > 0) {
    result.data = result.data.map((consultation: any) => {
      const consultationObj = consultation.toObject ? consultation.toObject() : consultation;

      if (consultationObj.slotId && consultationObj.bookedSlotId) {
        const bookedSlot = consultationObj.slotId.slots?.find(
          (slot: any) => slot._id.toString() === consultationObj.bookedSlotId.toString()
        );

        consultationObj.bookedSlot = bookedSlot || null;

        if (bookedSlot) {
          consultationObj.startTime = bookedSlot.startTime;
          consultationObj.endTime = bookedSlot.endTime;
        }
      } else {
        consultationObj.bookedSlot = null;
      }

      return consultationObj;
    });
  }

  return result;
};

// Helper function for date filtering using aggregation
const getConsultationsWithDateFilter = async (
  baseQuery: any,
  startDate: Date,
  endDate: Date,
  skip: number,
  limit: number,
) => {
  const pipeline: any[] = [
    { $match: baseQuery },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "slots",
        localField: "slotId",
        foreignField: "_id",
        as: "slotData"
      }
    },
    { $unwind: { path: "$slotData", preserveNullAndEmptyArrays: true } },
    {
      // Filter by slot date
      $match: {
        $or: [
          { "slotData.date": { $gte: startDate, $lte: endDate } },
          { "slotData": null } // Keep consultations without slots (chat)
        ]
      }
    },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "astrologers",
        localField: "astrologer",
        foreignField: "_id",
        as: "astrologer"
      }
    },
    { $unwind: { path: "$astrologer", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        "bookedSlot": {
          $cond: {
            if: { $and: [{ $ne: ["$slotData", null] }, { $ne: ["$bookedSlotId", null] }] },
            then: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$slotData.slots",
                    as: "slot",
                    cond: { $eq: ["$$slot._id", "$bookedSlotId"] }
                  }
                },
                0
              ]
            },
            else: null
          }
        }
      }
    },
    {
      $addFields: {
        "startTime": "$bookedSlot.startTime",
        "endTime": "$bookedSlot.endTime"
      }
    },
    {
      $project: {
        user: {
          _id: 1,
          accountId: 1,
          firstName: 1,
          lastName: 1,
          fullName: 1,
          profilePicture: 1,
          email: 1
        },
        astrologer: {
          _id: 1,
          accountId: 1,
          displayName: 1,
          firstName: 1,
          lastName: 1,
          profilePicture: 1
        },
        method: 1,
        status: 1,
        consultationFor: 1,
        requestMessage: 1,
        meeting: 1,
        slotId: 1,
        bookedSlotId: 1,
        bookedSlot: 1,
        startTime: 1,
        endTime: 1,
        slotData: {
          date: 1,
          slots: 1
        },
        createdAt: 1,
        updatedAt: 1,
        __v: 1
      }
    }
  ];

  const data = await Consultation.aggregate(pipeline);

  // Get total count for pagination
  const countPipeline = [
    { $match: baseQuery },
    {
      $lookup: {
        from: "slots",
        localField: "slotId",
        foreignField: "_id",
        as: "slotData"
      }
    },
    { $unwind: { path: "$slotData", preserveNullAndEmptyArrays: true } },
    {
      $match: {
        $or: [
          { "slotData.date": { $gte: startDate, $lte: endDate } },
          { "slotData": null }
        ]
      }
    },
    { $count: "total" }
  ];

  const countResult = await Consultation.aggregate(countPipeline);
  const total = countResult.length > 0 ? countResult[0].total : 0;

  return {
    data,
    meta: {
      total,
      filteredTotal: total,
      skip,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + data.length < total
    }
  };
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
  // 1. Find user or astrologer by accountId
  const astrologer = await Astrologer.findOne({ accountId });
  const user = await User.findOne({ accountId });

  if (!user && !astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "User or astrologer not found");
  }

  // 2. Find consultation with populated fields
  const consultation = await Consultation.findOne({
    _id: consultationId,
    $or: [{ user: user?._id }, { astrologer: astrologer?._id }],
  })
    .populate({
      path: "user",
      select: "firstName lastName fullName email profilePicture accountId",
    })
    .populate({
      path: "astrologer",
      select: "firstName lastName displayName profilePicture accountId experience",
    })
    .populate({
      path: "slotId",
      select: "date slots",
    });

  if (!consultation) {
    throw new AppError(httpStatus.NOT_FOUND, "Consultation not found");
  }

  // 3. Convert to object and process booked slot (matching getMyConsultationBookings format)
  const consultationObj: any = consultation.toObject ? consultation.toObject() : consultation;

  // 4. Process booked slot
  if (consultationObj.slotId && consultationObj.bookedSlotId) {
    const bookedSlot = consultationObj.slotId.slots?.find(
      (slot: any) => slot._id.toString() === consultationObj.bookedSlotId.toString()
    );

    consultationObj.bookedSlot = bookedSlot || null;

    if (bookedSlot) {
      consultationObj.startTime = bookedSlot.startTime;
      consultationObj.endTime = bookedSlot.endTime;
    }
  } else {
    consultationObj.bookedSlot = null;
  }

  // 5. Check if meeting is scheduled
  consultationObj.isMeetingScheduled = !!(consultationObj.meeting?.link && consultationObj.meeting?.scheduledAt);

  // 6. Clean up - remove unnecessary fields
  if (consultationObj.slotId) {
    // Keep slotId but remove the slots array to avoid duplication
  }

  return consultationObj;
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

  // 2. Find consultation and populate slotId
  const consultation = await Consultation.findOne({
    _id: consultationId,
    astrologer: astrologer._id,
  })
    .populate("user", "firstName lastName email")
    .populate("slotId"); // Populates the entire Slot document

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

  // 4. Check if slot exists
  if (!consultation.slotId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "No slot found for this consultation"
    );
  }

  // 5. Check if bookedSlotId exists
  if (!consultation.bookedSlotId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "No booked slot found for this consultation"
    );
  }

  const slotDoc = consultation.slotId as any;

  // 6. Find the specific booked slot using bookedSlotId
  const bookedSlot = slotDoc.slots.find(
    (slot: any) => slot._id.toString() === consultation?.bookedSlotId?.toString()
  );

  if (!bookedSlot) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Booked slot not found in the slot document"
    );
  }

  // 7. Get startTime and endTime from the booked slot
  const slotDate = new Date(slotDoc.date);
  const startTimeStr = bookedSlot.startTime; // "09:00"
  const endTimeStr = bookedSlot.endTime; // "09:30"

  // Parse the time strings to create Date objects
  const [startHour, startMinute] = startTimeStr.split(':').map(Number);
  const [endHour, endMinute] = endTimeStr.split(':').map(Number);

  const scheduledAt = new Date(slotDate);
  scheduledAt.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date(slotDate);
  endTime.setHours(endHour, endMinute, 0, 0);

  // 8. Get user email
  const user = await User.findById(consultation.user).populate("accountId", "email");
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // 9. Create meeting in Google Calendar
  const meeting = await googleCalendarService.createMeeting(
    astrologer,
    {
      summary: `Astrology Consultation: ${consultation.consultationFor}`,
      description: `
        Consultation with ${astrologer.displayName || astrologer.firstName}
        Slot: ${bookedSlot.startTime} - ${bookedSlot.endTime}
        Consultation ID: ${consultation._id}
      `,
      startTime: scheduledAt,
      endTime: endTime,
      attendeeEmail: (user.accountId as any)?.email,
      timezone: 'Asia/Kolkata',
    }
  );

  // 10. Update consultation with meeting details
  consultation.meeting.link = meeting.meetLink;
  consultation.meeting.scheduledAt = scheduledAt;
  consultation.status = "scheduled";
  await consultation.save();

  // 11. Send notifications
  await sendSingleNotification(
    user.accountId as any,
    "Meeting Scheduled!",
    `Your consultation with ${astrologer.displayName} has been scheduled for ${scheduledAt.toLocaleString()}. Join via: ${meeting.meetLink}`
  );

  await sendSingleNotification(
    accountId as any,
    "Meeting Scheduled Successfully",
    `You have scheduled a meeting with ${user.firstName} for ${scheduledAt.toLocaleString()}. Meet link: ${meeting.meetLink}`
  );

  return {
    success: true,
    consultation,
    meeting: {
      link: meeting.meetLink,
      scheduledAt: scheduledAt,
      duration: (parseInt(endTimeStr.split(':')[0]) * 60 + parseInt(endTimeStr.split(':')[1])) -
        (parseInt(startTimeStr.split(':')[0]) * 60 + parseInt(startTimeStr.split(':')[1])),
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
    throw new AppError(httpStatus.NOT_FOUND, "Consultation not found ");
  }

  // 4. Update consultation with recommendations
  consultation.recommendations = payload.recommendations.trim();
  consultation.status = "ended"
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
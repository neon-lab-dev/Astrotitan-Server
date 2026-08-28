/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { Types } from "mongoose";
import Consultation from "./consultation.model";
import { Astrologer } from "../../astrologer/astrologer.model";
import AppError from "../../../errors/AppError";
import { sendSingleNotification } from "../../../utils/sendSingleNotification";
import { infinitePaginate } from "../../../utils/infinitePaginate";
import { User } from "../../users/user.model";
import Slot from "../../astrologer/slot/slot.model";
import zoomVideoService from "./zoomVideo/zoomVideo.service";

type ConsultationMethod = "chat" | "call";
type RescheduleAction = "accept" | "reject";

const getUserByAccountId = async (accountId: string) => {
  const user = await User.findOne({ accountId });

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User not found"
    );
  }

  return user;
};

const getAstrologerByAccountId = async (accountId: string) => {
  const astrologer = await Astrologer.findOne({
    accountId,
  });

  if (!astrologer) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Astrologer not found"
    );
  }

  return astrologer;
};

const getBookedSlotDetails = async (
  consultation: {
    slotId?: Types.ObjectId;
    bookedSlotId?: Types.ObjectId;
  }
) => {
 
  if (!consultation.slotId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "No slot found for this consultation"
    );
  }

  if (!consultation.bookedSlotId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "No booked slot found for this consultation"
    );
  }

  const slotDoc = await Slot.findById(consultation.slotId);

  if (!slotDoc) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Slot not found"
    );
  }

  const bookedSlot = (slotDoc.slots as unknown as any[]).find(
    (slot: any) =>
      slot._id.toString() ===
      consultation.bookedSlotId?.toString()
  );

  if (!bookedSlot) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Booked slot not found"
    );
  }

  return {
    slotDoc,
    bookedSlot,
  };
};

const addBookedSlotDetails = (consultation: any) => {
  const consultationObj = consultation.toObject
    ? consultation.toObject()
    : consultation;

  if (
    consultationObj.slotId &&
    consultationObj.bookedSlotId
  ) {
    const bookedSlot =
      consultationObj.slotId.slots?.find(
        (slot: any) =>
          slot._id.toString() ===
          consultationObj.bookedSlotId.toString()
      );

    consultationObj.bookedSlot =
      bookedSlot || null;

    if (bookedSlot) {
      consultationObj.startTime =
        bookedSlot.startTime;

      consultationObj.endTime =
        bookedSlot.endTime;
    }
  } else {
    consultationObj.bookedSlot = null;
  }

  return consultationObj;
};

// Request consultation
const requestConsultation = async (
  accountId: string,
  payload: {
    astrologer: string;
    method: ConsultationMethod;
    consultationFor: string;
    requestMessage?: string;
    slotId?: string;
    bookedSlotId?: string;
  }
) => {
  const user =
    await getUserByAccountId(accountId);

  const astrologer =
    await Astrologer.findById(
      payload.astrologer
    );

  if (!astrologer) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Astrologer not found"
    );
  }

  const existingConsultation =
    await Consultation.findOne({
      user: user._id,
      astrologer: astrologer._id,
      status: "pending",
    });

  if (existingConsultation) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You already have a pending consultation request with this astrologer"
    );
  }

  let slotDoc: any = null;
  let slotIndex = -1;

  if (payload.method === "call") {
    if (!payload.slotId || !payload.bookedSlotId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Slot information is required for call consultations"
      );
    }

    slotDoc = await Slot.findOne({
      _id: payload.slotId,
      astrologerId: astrologer._id,
      "slots._id": payload.bookedSlotId,
    });

    if (!slotDoc) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Slot not found"
      );
    }

    slotIndex = slotDoc.slots.findIndex(
      (slot: any) =>
        slot._id.toString() ===
        payload.bookedSlotId
    );

    if (slotIndex === -1) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Booked slot not found"
      );
    }

    if (slotDoc.slots[slotIndex].isBooked) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This slot is already booked"
      );
    }
  }

  const consultation =
    await Consultation.create({
      user: user._id,
      astrologer: astrologer._id,
      method: payload.method,
      consultationFor:
        payload.consultationFor,
      requestMessage:
        payload.requestMessage,
      status: "pending",
      ...(payload.method === "call" && {
        slotId: new Types.ObjectId(
          payload.slotId
        ),
        bookedSlotId: new Types.ObjectId(
          payload.bookedSlotId
        ),
      }),
    });

  if (
    payload.method === "call" &&
    slotDoc &&
    slotIndex !== -1
  ) {
    slotDoc.slots[slotIndex].isBooked =
      true;

    await slotDoc.save();
  }

  const populatedConsultation =
    await Consultation.findById(
      consultation._id
    )
      .populate(
        "user",
        "firstName lastName fullName email profilePicture accountId"
      )
      .populate(
        "astrologer",
        "firstName lastName displayName profilePicture accountId"
      );

  await sendSingleNotification(
    accountId as any,
    "Consultation Request Sent Successfully",
    `Your consultation request with ${astrologer.displayName} has been sent successfully. You will be notified once they accept your request.`
  );

  return populatedConsultation;
};

// Get my consultation requests - User
const getMyConsultationRequests = async (
  accountId: string,
  filters: {
    status?: string;
    method?: string;
    date?: string;
  } = {},
  skip = 0,
  limit = 10
) => {
  const user =
    await getUserByAccountId(accountId);

  const query: Record<string, any> = {
    user: user._id,
  };

  if (
    filters.status &&
    filters.status !== "all"
  ) {
    query.status = filters.status;
  }

  if (
    filters.method &&
    filters.method !== "all"
  ) {
    query.method = filters.method;
  }

  if (filters.date) {
    const parsedDate = new Date(
      filters.date
    );

    if (!isNaN(parsedDate.getTime())) {
      const startDate = new Date(
        parsedDate
      );

      startDate.setHours(
        0,
        0,
        0,
        0
      );

      const endDate = new Date(
        parsedDate
      );

      endDate.setHours(
        23,
        59,
        59,
        999
      );

      return getConsultationsWithDateFilter(
        query,
        startDate,
        endDate,
        skip,
        limit
      );
    }
  }

  const result = await infinitePaginate(
    Consultation,
    query,
    skip,
    limit,
    [
      {
        path: "user",
        select:
          "firstName lastName fullName email profilePicture accountId",
      },
      {
        path: "astrologer",
        select:
          "firstName lastName displayName profilePicture accountId",
      },
      {
        path: "slotId",
        select: "date slots",
      },
    ]
  );

  if (
    result.data &&
    result.data.length > 0
  ) {
    result.data = result.data.map(
      addBookedSlotDetails
    );
  }

  return result;
};

// Get my consultation bookings - Astrologer
const getMyConsultationBookings = async (
  accountId: string,
  filters: {
    status?: string;
    method?: string;
    date?: string;
  } = {},
  skip = 0,
  limit = 10
) => {
  const astrologer =
    await getAstrologerByAccountId(
      accountId
    );

  const query: Record<string, any> = {
    astrologer: astrologer._id,
  };

  if (
    filters.status &&
    filters.status !== "all"
  ) {
    query.status = filters.status;
  }

  if (
    filters.method &&
    filters.method !== "all"
  ) {
    query.method = filters.method;
  }

  if (filters.date) {
    const parsedDate = new Date(
      filters.date
    );

    if (!isNaN(parsedDate.getTime())) {
      const startDate = new Date(
        parsedDate
      );

      startDate.setHours(
        0,
        0,
        0,
        0
      );

      const endDate = new Date(
        parsedDate
      );

      endDate.setHours(
        23,
        59,
        59,
        999
      );

      return getConsultationsWithDateFilter(
        query,
        startDate,
        endDate,
        skip,
        limit
      );
    }
  }

  const result = await infinitePaginate(
    Consultation,
    query,
    skip,
    limit,
    [
      {
        path: "user",
        select:
          "firstName lastName fullName email profilePicture accountId",
      },
      {
        path: "astrologer",
        select:
          "firstName lastName displayName profilePicture accountId",
      },
      {
        path: "slotId",
        select: "date slots",
      },
    ]
  );

  if (
    result.data &&
    result.data.length > 0
  ) {
    result.data = result.data.map(
      addBookedSlotDetails
    );
  }

  return result;
};

const getConsultationsWithDateFilter =
  async (
    baseQuery: Record<string, any>,
    startDate: Date,
    endDate: Date,
    skip: number,
    limit: number
  ) => {
    const pipeline: any[] = [
      {
        $match: baseQuery,
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $lookup: {
          from: "slots",
          localField: "slotId",
          foreignField: "_id",
          as: "slotData",
        },
      },
      {
        $unwind: {
          path: "$slotData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            {
              "slotData.date": {
                $gte: startDate,
                $lte: endDate,
              },
            },
            {
              slotData: null,
            },
          ],
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "astrologers",
          localField: "astrologer",
          foreignField: "_id",
          as: "astrologer",
        },
      },
      {
        $unwind: {
          path: "$astrologer",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          bookedSlot: {
            $cond: {
              if: {
                $and: [
                  {
                    $ne: [
                      "$slotData",
                      null,
                    ],
                  },
                  {
                    $ne: [
                      "$bookedSlotId",
                      null,
                    ],
                  },
                ],
              },
              then: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input:
                        "$slotData.slots",
                      as: "slot",
                      cond: {
                        $eq: [
                          "$$slot._id",
                          "$bookedSlotId",
                        ],
                      },
                    },
                  },
                  0,
                ],
              },
              else: null,
            },
          },
        },
      },
      {
        $addFields: {
          startTime:
            "$bookedSlot.startTime",
          endTime:
            "$bookedSlot.endTime",
        },
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
            email: 1,
          },
          astrologer: {
            _id: 1,
            accountId: 1,
            displayName: 1,
            firstName: 1,
            lastName: 1,
            profilePicture: 1,
          },
          method: 1,
          status: 1,
          consultationFor: 1,
          requestMessage: 1,
          recommendations: 1,
          callSession: 1,
          slotId: 1,
          bookedSlotId: 1,
          bookedSlot: 1,
          startTime: 1,
          endTime: 1,
          slotData: {
            date: 1,
            slots: 1,
          },
          acceptedAt: 1,
          startedAt: 1,
          endedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          __v: 1,
        },
      },
    ];

    const data =
      await Consultation.aggregate(
        pipeline
      );

    const countPipeline = [
      {
        $match: baseQuery,
      },
      {
        $lookup: {
          from: "slots",
          localField: "slotId",
          foreignField: "_id",
          as: "slotData",
        },
      },
      {
        $unwind: {
          path: "$slotData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            {
              "slotData.date": {
                $gte: startDate,
                $lte: endDate,
              },
            },
            {
              slotData: null,
            },
          ],
        },
      },
      {
        $count: "total",
      },
    ];

    const countResult =
      await Consultation.aggregate(
        countPipeline
      );

    const total =
      countResult.length > 0
        ? countResult[0].total
        : 0;

    return {
      data,
      meta: {
        total,
        filteredTotal: total,
        skip,
        limit,
        totalPages:
          Math.ceil(total / limit),
        hasMore:
          skip + data.length < total,
      },
    };
  };

// Change consultation status - Astrologer
const changeConsultationStatus = async (
  consultationId: string,
  accountId: string,
) => {
  const astrologer =
    await getAstrologerByAccountId(
      accountId
    );

  const consultation =
    await Consultation.findOne({
      _id: consultationId,
      astrologer: astrologer._id,
    });

  if (!consultation) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Consultation not found or you are not authorized"
    );
  }

  if (consultation.status !== "pending") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `This consultation is already ${consultation.status}`
    );
  }

  consultation.status = "scheduled";
  consultation.acceptedAt =
    new Date();

  await consultation.save();

  return Consultation.findById(
    consultation._id
  )
    .populate(
      "user",
      "firstName lastName fullName email profilePicture accountId"
    )
    .populate(
      "astrologer",
      "firstName lastName displayName profilePicture accountId"
    );
};

// Get single consultation
const getSingleConsultation = async (
  consultationId: string,
  accountId: string
) => {
  const [astrologer, user] =
    await Promise.all([
      Astrologer.findOne({
        accountId,
      }),
      User.findOne({
        accountId,
      }),
    ]);

  if (!user && !astrologer) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User or astrologer not found"
    );
  }

  const participantQuery: Record<
    string,
    any
  > = {
    _id: consultationId,
    $or: [],
  };

  if (user) {
    participantQuery.$or.push({
      user: user._id,
    });
  }

  if (astrologer) {
    participantQuery.$or.push({
      astrologer: astrologer._id,
    });
  }

  const consultation =
    await Consultation.findOne(
      participantQuery
    )
      .populate({
        path: "user",
        select:
          "firstName lastName fullName email profilePicture accountId",
      })
      .populate({
        path: "astrologer",
        select:
          "firstName lastName displayName profilePicture accountId experience",
      })
      .populate({
        path: "slotId",
        select: "date slots",
      });

  if (!consultation) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Consultation not found"
    );
  }

  const consultationObj =
    addBookedSlotDetails(
      consultation
    );

  consultationObj.isCallScheduled =
    !!(
      consultationObj.method === "call" &&
      consultationObj.callSession?.sessionName &&
      consultationObj.callSession?.scheduledAt
    );

  consultationObj.isCallAvailable =
    !!(
      consultationObj.method === "call" &&
      consultationObj.callSession?.sessionName &&
      ["scheduled", "ongoing"].includes(
        consultationObj.status
      )
    );

  return consultationObj;
};

// Schedule Zoom consultation
const scheduleConsultation = async (
  consultationId: string,
  accountId: string
) => {
  const astrologer =
    await getAstrologerByAccountId(
      accountId
    );

  const consultation =
    await Consultation.findOne({
      _id: consultationId,
      astrologer: astrologer._id,
    });

  if (!consultation) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Consultation not found or not authorized"
    );
  }

  if (consultation.method !== "call") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This consultation is not a call session"
    );
  }

  // if (consultation.status !== "scheduled") {
  //   throw new AppError(
  //     httpStatus.BAD_REQUEST,
  //     `Consultation must be scheduled before creating the call session`
  //   );
  // }

  if (consultation.callSession?.sessionName) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Call session has already been created"
    );
  }

   console.log(consultation);

  const {
    slotDoc,
    bookedSlot,
  } =
    await getBookedSlotDetails(
      consultation as any
    );
    console.log(bookedSlot);

  const scheduledAt = `${slotDoc.date} ${bookedSlot.startTime}-${bookedSlot.endTime}`;

  const duration = "30 mins";

  const sessionName =
    zoomVideoService.generateSessionName(
      consultation._id.toString()
    );

  const sessionPassword =
    zoomVideoService.generateSessionPassword();

  consultation.callSession = {
    provider: "zoom_video_sdk",
    sessionName,
    sessionPassword,
    scheduledAt,
  };

  await consultation.save();

  const user = await User.findById(
    consultation.user
  );

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User not found"
    );
  }

  await sendSingleNotification(
    user.accountId as any,
    "Consultation Scheduled!",
    `Your consultation with ${astrologer.displayName} has been scheduled for ${scheduledAt.toLocaleString()}.`
  );

  await sendSingleNotification(
    accountId as any,
    "Consultation Scheduled Successfully",
    `Your consultation with ${user.firstName} has been scheduled for ${scheduledAt.toLocaleString()}.`
  );

  return {
    success: true,
    consultation,
    callSession: {
      provider: "zoom_video_sdk",
      sessionName,
      scheduledAt,
      duration,
    },
  };
};

// Generate Zoom Video SDK credentials for joining
const joinConsultation = async (
  consultationId: string,
  accountId: string
) => {
  const [user, astrologer] =
    await Promise.all([
      User.findOne({
        accountId,
      }),
      Astrologer.findOne({
        accountId,
      }),
    ]);

  if (!user && !astrologer) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User or astrologer not found"
    );
  }

  const consultation =
    await Consultation.findById(
      consultationId
    );

  if (!consultation) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Consultation not found"
    );
  }

  let participantId: string;
  let participantName: string;
  let roleType: 0 | 1;

  if (
    user &&
    consultation.user.toString() ===
    user._id.toString()
  ) {
    participantId =
      user._id.toString();

    participantName =
      `${user.firstName || ""} ${user.lastName || ""
        }`.trim() || "User";

    roleType = 0;
  } else if (
    astrologer &&
    consultation.astrologer.toString() ===
    astrologer._id.toString()
  ) {
    participantId =
      astrologer._id.toString();

    participantName =
      astrologer.displayName ||
      `${astrologer.firstName || ""} ${astrologer.lastName || ""
        }`.trim() ||
      "Astrologer";

    roleType = 1;
  } else {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not a participant in this consultation"
    );
  }

  if (consultation.method !== "call") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This consultation is not a call session"
    );
  }

  if (
    !consultation.callSession?.sessionName
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Call session has not been scheduled yet"
    );
  }

  if (
    !["scheduled", "ongoing"].includes(
      consultation.status
    )
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Consultation cannot be joined while status is ${consultation.status}`
    );
  }

  const token =
    zoomVideoService.generateToken({
      sessionName:
        consultation.callSession
          .sessionName,
      userKey: participantId,
      roleType,
    });

  return {
    success: true,
    data: {
      provider: "zoom_video_sdk",
      sessionName:
        consultation.callSession
          .sessionName,
      sessionPassword:
        consultation.callSession
          .sessionPassword,
      token,
      userName: participantName,
      consultationId:
        consultation._id,
      scheduledAt:
        consultation.callSession
          .scheduledAt,
      role:
        roleType === 1
          ? "astrologer"
          : "user",
    },
  };
};

// Start consultation
const startConsultation = async (
  consultationId: string,
  accountId: string
) => {
  const astrologer =
    await getAstrologerByAccountId(
      accountId
    );

  const consultation =
    await Consultation.findOne({
      _id: consultationId,
      astrologer: astrologer._id,
    });

  if (!consultation) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Consultation not found or not authorized"
    );
  }

  if (consultation.method !== "call") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This consultation is not a call session"
    );
  }

  if (
    !["scheduled", "ongoing"].includes(
      consultation.status
    )
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Consultation cannot be started while status is ${consultation.status}`
    );
  }

  if (!consultation.startedAt) {
    consultation.startedAt =
      new Date();
  }

  consultation.status = "ongoing";

  await consultation.save();

  return consultation;
};

// End consultation session
const endConsultationSession = async (
  consultationId: string,
  accountId: string
) => {
  const astrologer =
    await Astrologer.findOne({
      accountId,
    });

  const user =
    await User.findOne({
      accountId,
    });

  if (!user && !astrologer) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User or astrologer not found"
    );
  }

  const participantQuery: Record<
    string,
    any
  > = {
    _id: consultationId,
    $or: [],
  };

  if (user) {
    participantQuery.$or.push({
      user: user._id,
    });
  }

  if (astrologer) {
    participantQuery.$or.push({
      astrologer: astrologer._id,
    });
  }

  const consultation =
    await Consultation.findOne(
      participantQuery
    );

  if (!consultation) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Consultation not found or you are not authorized"
    );
  }

  if (
    !["scheduled", "ongoing"].includes(
      consultation.status
    )
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot end consultation with status ${consultation.status}`
    );
  }

  consultation.status = "ended";
  consultation.endedAt =
    new Date();

  await consultation.save();

  return consultation;
};

// Add review
const addReview = async (
  consultationId: string,
  accountId: string,
  payload: {
    review: string;
    rating: number;
  }
) => {
  if (
    payload.rating < 1 ||
    payload.rating > 5
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Rating must be between 1 and 5"
    );
  }

  const user =
    await getUserByAccountId(
      accountId
    );

  const consultation =
    await Consultation.findOne({
      _id: consultationId,
      user: user._id,
      status: "ended",
    })
      .populate(
        "astrologer",
        "accountId"
      )
      .populate(
        "user",
        "fullName"
      );

  if (!consultation) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Consultation not found or not ended yet. You can only review ended consultations."
    );
  }

  if (
    consultation.review &&
    consultation.rating
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already reviewed this consultation"
    );
  }

  consultation.review =
    payload.review;
  consultation.rating =
    payload.rating;

  await consultation.save();

  const astrologer =
    await Astrologer.findById(
      consultation.astrologer
    );

  if (!astrologer) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Astrologer not found"
    );
  }

  const existingReviewIndex =
    astrologer.reviews?.findIndex(
      (review: any) =>
        review.user.toString() ===
        user._id.toString()
    );

  if (
    existingReviewIndex !== undefined &&
    existingReviewIndex !== -1
  ) {
    astrologer.reviews[
      existingReviewIndex
    ].review = payload.review;

    astrologer.reviews[
      existingReviewIndex
    ].rating = payload.rating;

    astrologer.reviews[
      existingReviewIndex
    ].updatedAt = new Date();
  } else {
    if (!astrologer.reviews) {
      astrologer.reviews = [];
    }

    astrologer.reviews.push({
      user: user._id as any,
      review: payload.review,
      rating: payload.rating,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const totalRating =
    astrologer.reviews.reduce(
      (
        sum: number,
        review: any
      ) => sum + review.rating,
      0
    );

  astrologer.rating =
    totalRating /
    astrologer.reviews.length;

  await astrologer.save();

  const updatedConsultation =
    await Consultation.findById(
      consultationId
    )
      .populate(
        "user",
        "firstName lastName fullName email profilePicture accountId"
      )
      .populate(
        "astrologer",
        "firstName lastName displayName profilePicture accountId"
      );

  await sendSingleNotification(
    (consultation.astrologer as any)
      ?.accountId as any,
    `${(consultation.user as any)?.fullName} has left a review for you with rating ${payload.rating}`,
    payload.review
  );

  return {
    success: true,
    message: "Review added successfully",
    data: {
      consultation:
        updatedConsultation,
      astrologerRating:
        astrologer.rating,
      totalReviews:
        astrologer.reviews.length,
    },
  };
};

// Send reschedule request
const sendRescheduleRequest =
  async (
    consultationId: string,
    accountId: string,
    payload: {
      requestedTime: Date;
      reason: string;
    }
  ) => {
    const user =
      await getUserByAccountId(
        accountId
      );

    const consultation =
      await Consultation.findOne({
        _id: consultationId,
        user: user._id,
      });

    if (!consultation) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Consultation not found or not authorized"
      );
    }

    if (
      consultation.status !==
      "scheduled"
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot reschedule: consultation status is ${consultation.status}`
      );
    }

    if (
      consultation.callSession
        ?.rescheduleRequest
        ?.status === "pending"
    ) {
      throw new AppError(
        httpStatus.CONFLICT,
        "You already have a pending reschedule request"
      );
    }

    if (!consultation.callSession) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Call session not found"
      );
    }

    consultation.callSession.rescheduleRequest =
    {
      requestedTime:
        payload.requestedTime,
      reason: payload.reason,
      status: "pending",
    };

    await consultation.save();

    const astrologer =
      await Astrologer.findById(
        consultation.astrologer
      );

    await sendSingleNotification(
      astrologer?.accountId as any,
      "Reschedule Request Received",
      `${user.firstName} has requested to reschedule the consultation. Reason: ${payload.reason}`
    );

    return {
      success: true,
      message:
        "Reschedule request sent successfully",
      rescheduleRequest:
        consultation.callSession
          .rescheduleRequest,
    };
  };

// Accept or reject reschedule request
const rescheduleConsultation =
  async (
    consultationId: string,
    accountId: string,
    payload: {
      action: RescheduleAction;
    }
  ) => {
    const astrologer =
      await getAstrologerByAccountId(
        accountId
      );

    const consultation =
      await Consultation.findOne({
        _id: consultationId,
        astrologer: astrologer._id,
      });

    if (!consultation) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Consultation not found or not authorized"
      );
    }

    if (
      consultation.status !==
      "scheduled"
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot reschedule: consultation status is ${consultation.status}`
      );
    }

    const rescheduleRequest =
      consultation.callSession
        ?.rescheduleRequest;

    if (!rescheduleRequest) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No reschedule request found"
      );
    }

    if (
      rescheduleRequest.status !==
      "pending"
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This reschedule request has already been processed"
      );
    }

    const user =
      await User.findById(
        consultation.user
      );

    if (payload.action === "accept") {
      const newStartTime =
        new Date(
          rescheduleRequest.requestedTime
        );

      if (
        !consultation.callSession
      ) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Call session not found"
        );
      }

      consultation.callSession.scheduledAt =
        newStartTime as any;

      rescheduleRequest.status =
        "accepted";

      rescheduleRequest.respondedAt =
        new Date();

      await consultation.save();

      await sendSingleNotification(
        user?.accountId as any,
        "Consultation Rescheduled",
        `Your consultation has been rescheduled to ${newStartTime.toLocaleString()}.`
      );

      return {
        success: true,
        message:
          "Reschedule request accepted",
        newTime: newStartTime,
      };
    }

    const originalTime =
      consultation.callSession
        ?.scheduledAt;

    rescheduleRequest.status =
      "rejected";

    rescheduleRequest.respondedAt =
      new Date();

    await consultation.save();

    await sendSingleNotification(
      user?.accountId as any,
      "Reschedule Request Rejected",
      "Your reschedule request was not approved. The original consultation time remains unchanged."
    );

    return {
      success: true,
      message:
        "Reschedule request rejected",
      originalTime,
    };
  };

// Add recommendations
const addRecommendations =
  async (
    consultationId: string,
    accountId: string,
    payload: {
      recommendations: string;
    }
  ) => {
    const astrologer =
      await getAstrologerByAccountId(
        accountId
      );

    const consultation =
      await Consultation.findOne({
        _id: consultationId,
        astrologer: astrologer._id,
      });

    if (!consultation) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Consultation not found"
      );
    }

    if (
      consultation.status ===
      "ended"
    ) {
      consultation.recommendations =
        payload.recommendations.trim();

      await consultation.save();

      return {
        success: true,
        message:
          "Recommendations added successfully",
        data: consultation,
      };
    }

    consultation.recommendations =
      payload.recommendations.trim();

    consultation.status = "ended";
    consultation.endedAt =
      consultation.endedAt ||
      new Date();
    consultation.endedBy =
      astrologer._id;

    await consultation.save();

    return {
      success: true,
      message:
        "Recommendations added successfully",
      data: consultation,
    };
  };

export const ConsultationServices = {
  requestConsultation,
  getMyConsultationRequests,
  getMyConsultationBookings,
  changeConsultationStatus,
  getSingleConsultation,
  scheduleConsultation,
  joinConsultation,
  startConsultation,
  endConsultationSession,
  addReview,
  sendRescheduleRequest,
  rescheduleConsultation,
  addRecommendations,
};
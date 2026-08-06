"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultationServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const consultation_model_1 = __importDefault(require("./consultation.model"));
const astrologer_model_1 = require("../../astrologer/astrologer.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const sendSingleNotification_1 = require("../../../utils/sendSingleNotification");
const infinitePaginate_1 = require("../../../utils/infinitePaginate");
const user_model_1 = require("../../users/user.model");
const googleCalendar_service_1 = __importDefault(require("../googleCalendar/googleCalendar.service"));
const slot_model_1 = __importDefault(require("../../astrologer/slot/slot.model"));
const requestConsultation = (accountId, // This is Account ID
payload) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Check if user exists
    const user = yield user_model_1.User.findOne({ accountId });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // 2. Check if astrologer exists
    const astrologer = yield astrologer_model_1.Astrologer.findById(payload.astrologer);
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // 3. Check if there's already a pending consultation
    const existingConsultation = yield consultation_model_1.default.findOne({
        user: user === null || user === void 0 ? void 0 : user._id,
        astrologer: payload.astrologer,
        status: "pending",
    });
    if (existingConsultation) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "You already have a pending consultation request with this astrologer");
    }
    // 4. If method is "call" and bookedSlotId is provided, verify and book the slot
    let slotDoc = null;
    let slotIndex = -1;
    if (payload.method === "call" && payload.bookedSlotId) {
        // Find the slot document that contains this bookedSlotId
        slotDoc = yield slot_model_1.default.findOne({
            astrologerId: payload.astrologer,
            "slots._id": payload.bookedSlotId,
        });
        if (!slotDoc) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Slot not found");
        }
        // Find the specific slot using bookedSlotId (NOT slotId)
        slotIndex = slotDoc.slots.findIndex((slot) => slot._id.toString() === payload.bookedSlotId);
        if (slotIndex === -1) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Slot not found in the slots array");
        }
        // Check if slot is already booked
        if (slotDoc.slots[slotIndex].isBooked) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "This slot is already booked");
        }
    }
    // 5. Create consultation
    const consultation = yield consultation_model_1.default.create(Object.assign({ user: user === null || user === void 0 ? void 0 : user._id, astrologer: payload.astrologer, method: payload.method, consultationFor: payload.consultationFor, requestMessage: payload.requestMessage, status: "pending" }, (payload.method === "call" && payload.slotId && {
        slotId: payload.slotId, // The Slot document ID
        bookedSlotId: payload.bookedSlotId, // The specific slot's _id
    })));
    // 6. Mark the specific slot as booked
    if (payload.method === "call" && slotDoc && slotIndex !== -1) {
        slotDoc.slots[slotIndex].isBooked = true;
        yield slotDoc.save();
    }
    // 7. Populate consultation
    const populatedConsultation = yield consultation_model_1.default.findById(consultation._id)
        .populate("user", "firstName lastName email profilePicture")
        .populate("astrologer", "firstName lastName displayName profilePicture");
    // 8. Send notification
    yield (0, sendSingleNotification_1.sendSingleNotification)(accountId, "Consultation Request Sent Successfully", `Your consultation request with ${astrologer === null || astrologer === void 0 ? void 0 : astrologer.displayName} has been sent successfully. You will be notified once they accept your request.`);
    return populatedConsultation;
});
/* Get My Consultation Requests - User */
const getMyConsultationRequests = (accountId_1, ...args_1) => __awaiter(void 0, [accountId_1, ...args_1], void 0, function* (accountId, filters = {}, skip = 0, limit = 10) {
    // Find the actual User document using accountId
    const user = yield user_model_1.User.findOne({ accountId: accountId });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // Use the User's _id for the query
    const query = { user: user._id };
    if (filters.status && filters.status !== "all") {
        query.status = filters.status;
    }
    const result = yield (0, infinitePaginate_1.infinitePaginate)(consultation_model_1.default, query, skip, limit, [
        {
            path: "user",
            select: "firstName lastName fullName profilePicture accountId"
        },
        {
            path: "astrologer",
            select: "firstName lastName displayName profilePicture accountId"
        }
    ]);
    return result;
});
/* Get My Consultation Bookings - Astrologer */
const getMyConsultationBookings = (accountId_1, ...args_1) => __awaiter(void 0, [accountId_1, ...args_1], void 0, function* (accountId, filters = {}, skip = 0, limit = 10) {
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId });
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    const query = { astrologer: astrologer === null || astrologer === void 0 ? void 0 : astrologer._id };
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
            const result = yield getConsultationsWithDateFilter(query, startDate, endDate, skip, limit);
            return result;
        }
    }
    // If no date filter, use the regular pagination
    const result = yield (0, infinitePaginate_1.infinitePaginate)(consultation_model_1.default, query, skip, limit, [
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
    ]);
    // Process each consultation to get the booked slot details
    if (result.data && result.data.length > 0) {
        result.data = result.data.map((consultation) => {
            var _a;
            const consultationObj = consultation.toObject ? consultation.toObject() : consultation;
            if (consultationObj.slotId && consultationObj.bookedSlotId) {
                const bookedSlot = (_a = consultationObj.slotId.slots) === null || _a === void 0 ? void 0 : _a.find((slot) => slot._id.toString() === consultationObj.bookedSlotId.toString());
                consultationObj.bookedSlot = bookedSlot || null;
                if (bookedSlot) {
                    consultationObj.startTime = bookedSlot.startTime;
                    consultationObj.endTime = bookedSlot.endTime;
                }
            }
            else {
                consultationObj.bookedSlot = null;
            }
            return consultationObj;
        });
    }
    return result;
});
// Helper function for date filtering using aggregation
const getConsultationsWithDateFilter = (baseQuery, startDate, endDate, skip, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const pipeline = [
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
    const data = yield consultation_model_1.default.aggregate(pipeline);
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
    const countResult = yield consultation_model_1.default.aggregate(countPipeline);
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
});
/* Change Consultation Status - Astrologer */
const changeConsultationStatus = (consultationId, accountId, // This is Account ID
payload) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId });
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // Find consultation using Account ID directly
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        astrologer: astrologer._id,
    }).populate("user", "accountId");
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found or you are not authorized");
    }
    // Check if consultation is already handled
    if (consultation.status !== "pending") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `This consultation is already ${consultation.status}`);
    }
    // Update status
    const updateData = {
        status: payload.status,
    };
    const updatedConsultation = yield consultation_model_1.default.findByIdAndUpdate(consultationId, updateData, { new: true })
        .populate("user", "firstName lastName email profilePicture")
        .populate("astrologer", "firstName lastName displayName profilePicture");
    return updatedConsultation;
});
/* Get Single Consultation */
const getSingleConsultation = (consultationId, accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId });
    const user = yield user_model_1.User.findOne({ accountId });
    if (!user && !astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User or astrologer not found");
    }
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        $or: [{ user: user === null || user === void 0 ? void 0 : user._id }, { astrologer: astrologer === null || astrologer === void 0 ? void 0 : astrologer._id }],
    })
        .populate("user")
        .populate("astrologer");
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found");
    }
    return consultation;
});
const endConsultationSession = (consultationId, accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const consultation = yield consultation_model_1.default.findById(consultationId);
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found");
    }
    ;
    const result = yield consultation_model_1.default.findOneAndUpdate({ _id: consultationId }, { status: "ended", endedBy: accountId }, { new: true });
    return result;
});
/* Add Review for Consultation */
const addReview = (consultationId, userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // Validate rating (1-5)
    if (payload.rating < 1 || payload.rating > 5) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Rating must be between 1 and 5");
    }
    const user = yield user_model_1.User.findOne({ accountId: userId });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // Find consultation and check if it belongs to the user
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        user: user === null || user === void 0 ? void 0 : user._id,
        status: "ended",
    }).populate("astrologer", "accountId")
        .populate("user", "fullName");
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found or not ended yet. You can only review ended consultations.");
    }
    // Check if review already exists for this consultation
    if (consultation.review && consultation.rating) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You have already reviewed this consultation");
    }
    // Update consultation with review
    consultation.review = payload.review;
    consultation.rating = payload.rating;
    yield consultation.save();
    // Find the astrologer
    const astrologer = yield astrologer_model_1.Astrologer.findById(consultation.astrologer);
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // Check if user already reviewed this astrologer
    const existingReviewIndex = (_a = astrologer.reviews) === null || _a === void 0 ? void 0 : _a.findIndex((review) => review.user.toString() === userId);
    if (existingReviewIndex !== undefined && existingReviewIndex !== -1) {
        // Update existing review
        astrologer.reviews[existingReviewIndex].review = payload.review;
        astrologer.reviews[existingReviewIndex].rating = payload.rating;
    }
    else {
        // Add new review to astrologer
        if (!astrologer.reviews) {
            astrologer.reviews = [];
        }
        astrologer.reviews.push({
            user: user === null || user === void 0 ? void 0 : user._id,
            review: payload.review,
            rating: payload.rating,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    // Recalculate average rating
    const totalRating = astrologer.reviews.reduce((sum, rev) => sum + rev.rating, 0);
    astrologer.rating = totalRating / astrologer.reviews.length;
    yield astrologer.save();
    // Populate consultation with user and astrologer details
    const updatedConsultation = yield consultation_model_1.default.findById(consultationId)
        .populate("user", "firstName lastName email profilePicture")
        .populate("astrologer", "firstName lastName displayName profilePicture");
    yield (0, sendSingleNotification_1.sendSingleNotification)((_b = consultation === null || consultation === void 0 ? void 0 : consultation.astrologer) === null || _b === void 0 ? void 0 : _b.accountId, `${(_c = consultation === null || consultation === void 0 ? void 0 : consultation.user) === null || _c === void 0 ? void 0 : _c.fullName} has left a review for you with rating ${payload.rating}`, payload === null || payload === void 0 ? void 0 : payload.review);
    return {
        success: true,
        message: "Review added successfully",
        data: {
            consultation: updatedConsultation,
            astrologerRating: astrologer.rating,
            totalReviews: astrologer.reviews.length,
        },
    };
});
//Schedule a meeting for a consultation (Astrologer)
const scheduleMeeting = (consultationId, accountId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // 1. Find astrologer
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId }).select("+googleCalendar.refreshToken +googleCalendar.accessToken +googleCalendar.tokenExpiry +googleCalendar.email +googleCalendar.calendarId +googleCalendar.isConnected");
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // 2. Find consultation and populate slotId
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        astrologer: astrologer._id,
    })
        .populate("user", "firstName lastName email")
        .populate("slotId"); // Populates the entire Slot document
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found or not authorized");
    }
    // 3. Verify method is call
    if (consultation.method !== "call") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "This consultation is not a call session");
    }
    // 4. Check if slot exists
    if (!consultation.slotId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "No slot found for this consultation");
    }
    // 5. Check if bookedSlotId exists
    if (!consultation.bookedSlotId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "No booked slot found for this consultation");
    }
    const slotDoc = consultation.slotId;
    // 6. Find the specific booked slot using bookedSlotId
    const bookedSlot = slotDoc.slots.find((slot) => { var _a; return slot._id.toString() === ((_a = consultation === null || consultation === void 0 ? void 0 : consultation.bookedSlotId) === null || _a === void 0 ? void 0 : _a.toString()); });
    if (!bookedSlot) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Booked slot not found in the slot document");
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
    const user = yield user_model_1.User.findById(consultation.user).populate("accountId", "email");
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // 9. Create meeting in Google Calendar
    const meeting = yield googleCalendar_service_1.default.createMeeting(astrologer, {
        summary: `Astrology Consultation: ${consultation.consultationFor}`,
        description: `
        Consultation with ${astrologer.displayName || astrologer.firstName}
        Slot: ${bookedSlot.startTime} - ${bookedSlot.endTime}
        Consultation ID: ${consultation._id}
      `,
        startTime: scheduledAt,
        endTime: endTime,
        attendeeEmail: (_a = user.accountId) === null || _a === void 0 ? void 0 : _a.email,
        timezone: 'Asia/Kolkata',
    });
    // 10. Update consultation with meeting details
    consultation.meeting.link = meeting.meetLink;
    consultation.meeting.scheduledAt = scheduledAt;
    consultation.status = "scheduled";
    yield consultation.save();
    // 11. Send notifications
    yield (0, sendSingleNotification_1.sendSingleNotification)(user.accountId, "Meeting Scheduled!", `Your consultation with ${astrologer.displayName} has been scheduled for ${scheduledAt.toLocaleString()}. Join via: ${meeting.meetLink}`);
    yield (0, sendSingleNotification_1.sendSingleNotification)(accountId, "Meeting Scheduled Successfully", `You have scheduled a meeting with ${user.firstName} for ${scheduledAt.toLocaleString()}. Meet link: ${meeting.meetLink}`);
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
});
//Send reschedule request (User)
const sendRescheduleRequest = (consultationId, accountId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // 1. Find user
    const user = yield user_model_1.User.findOne({ accountId });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // 2. Find consultation
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        user: user._id,
    }).populate("astrologer", "accountId firstName lastName displayName email");
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found or not authorized");
    }
    // 3. Verify consultation is scheduled
    if (consultation.status !== "scheduled") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Cannot reschedule: consultation status is ${consultation.status}`);
    }
    // 4. Check if there's already a pending reschedule request
    if ((_b = (_a = consultation.meeting) === null || _a === void 0 ? void 0 : _a.rescheduleRequest) === null || _b === void 0 ? void 0 : _b.isRescheduled) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "You already have a pending reschedule request");
    }
    // 5. Add reschedule request
    consultation.meeting = Object.assign(Object.assign({}, consultation.meeting), { rescheduleRequest: {
            requestedTime: payload.requestedTime,
            reason: payload.reason,
            isRescheduled: false,
        } });
    yield consultation.save();
    // 6. Notify astrologer
    const astrologer = yield astrologer_model_1.Astrologer.findById(consultation.astrologer);
    yield (0, sendSingleNotification_1.sendSingleNotification)(astrologer === null || astrologer === void 0 ? void 0 : astrologer.accountId, "Reschedule Request Received", `${user.firstName} has requested to reschedule the meeting. Reason: ${payload.reason}`);
    return {
        success: true,
        message: "Reschedule request sent successfully",
        rescheduleRequest: (_c = consultation.meeting) === null || _c === void 0 ? void 0 : _c.rescheduleRequest,
    };
});
//Accept or reject reschedule request (Astrologer)
const rescheduleMeeting = (consultationId, accountId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // 1. Find astrologer
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId });
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // 2. Find consultation
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        astrologer: astrologer._id,
    }).populate("user", "accountId firstName lastName email");
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found or not authorized");
    }
    // 3. Verify consultation is scheduled
    if (consultation.status !== "scheduled") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Cannot reschedule: consultation status is ${consultation.status}`);
    }
    // 4. Verify there's a reschedule request
    if (!((_a = consultation.meeting) === null || _a === void 0 ? void 0 : _a.rescheduleRequest)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "No reschedule request found");
    }
    const rescheduleRequest = consultation.meeting.rescheduleRequest;
    // 5. Check if already processed
    if (rescheduleRequest.isRescheduled === true) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "This reschedule request has already been processed");
    }
    if (payload.action === "accept") {
        // 6a. Update Google Calendar event
        const newStartTime = new Date(rescheduleRequest.requestedTime);
        // 6b. Update consultation with new meeting time
        consultation.meeting.scheduledAt = newStartTime;
        consultation.meeting.rescheduleRequest.isRescheduled = true;
        yield consultation.save();
        // 6c. Notify user
        const user = yield user_model_1.User.findById(consultation.user);
        yield (0, sendSingleNotification_1.sendSingleNotification)(user === null || user === void 0 ? void 0 : user.accountId, "Meeting Rescheduled", `Your meeting has been rescheduled to ${newStartTime.toLocaleString()}.`);
        return {
            success: true,
            message: "Reschedule request accepted",
            newTime: newStartTime,
        };
    }
    else {
        // 7. Reject reschedule
        consultation.meeting.rescheduleRequest.isRescheduled = false;
        yield consultation.save();
        // 8. Notify user
        const user = yield user_model_1.User.findById(consultation.user);
        yield (0, sendSingleNotification_1.sendSingleNotification)(user === null || user === void 0 ? void 0 : user.accountId, "Reschedule Request Rejected", "Your reschedule request was not approved. The original meeting time remains unchanged.");
        return {
            success: true,
            message: "Reschedule request rejected",
            originalTime: consultation.meeting.scheduledAt,
        };
    }
});
const addRecommendations = (consultationId, accountId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Find astrologer
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId });
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // 2. Find consultation
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        astrologer: astrologer._id,
    });
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found or not authorized");
    }
    // 3. Verify consultation is ended
    if (consultation.status !== "ended") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Recommendations can only be added after the consultation is ended. Current status: ${consultation.status}`);
    }
    // 4. Update consultation with recommendations
    consultation.recommendations = payload.recommendations.trim();
    yield consultation.save();
    return {
        success: true,
        message: "Recommendations added successfully",
        data: consultation,
    };
});
exports.ConsultationServices = {
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

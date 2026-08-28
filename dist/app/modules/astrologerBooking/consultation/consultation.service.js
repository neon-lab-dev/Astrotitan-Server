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
const mongoose_1 = require("mongoose");
const consultation_model_1 = __importDefault(require("./consultation.model"));
const astrologer_model_1 = require("../../astrologer/astrologer.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const sendSingleNotification_1 = require("../../../utils/sendSingleNotification");
const infinitePaginate_1 = require("../../../utils/infinitePaginate");
const user_model_1 = require("../../users/user.model");
const slot_model_1 = __importDefault(require("../../astrologer/slot/slot.model"));
const zoomVideo_service_1 = __importDefault(require("./zoomVideo/zoomVideo.service"));
const getUserByAccountId = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ accountId });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    return user;
});
const getAstrologerByAccountId = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologer = yield astrologer_model_1.Astrologer.findOne({
        accountId,
    });
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    return astrologer;
});
const getBookedSlotDetails = (consultation) => __awaiter(void 0, void 0, void 0, function* () {
    if (!consultation.slotId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "No slot found for this consultation");
    }
    if (!consultation.bookedSlotId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "No booked slot found for this consultation");
    }
    const slotDoc = yield slot_model_1.default.findById(consultation.slotId);
    if (!slotDoc) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Slot not found");
    }
    const bookedSlot = slotDoc.slots.find((slot) => {
        var _a;
        return slot._id.toString() ===
            ((_a = consultation.bookedSlotId) === null || _a === void 0 ? void 0 : _a.toString());
    });
    if (!bookedSlot) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Booked slot not found");
    }
    return {
        slotDoc,
        bookedSlot,
    };
});
const addBookedSlotDetails = (consultation) => {
    var _a;
    const consultationObj = consultation.toObject
        ? consultation.toObject()
        : consultation;
    if (consultationObj.slotId &&
        consultationObj.bookedSlotId) {
        const bookedSlot = (_a = consultationObj.slotId.slots) === null || _a === void 0 ? void 0 : _a.find((slot) => slot._id.toString() ===
            consultationObj.bookedSlotId.toString());
        consultationObj.bookedSlot =
            bookedSlot || null;
        if (bookedSlot) {
            consultationObj.startTime =
                bookedSlot.startTime;
            consultationObj.endTime =
                bookedSlot.endTime;
        }
    }
    else {
        consultationObj.bookedSlot = null;
    }
    return consultationObj;
};
// Request consultation
const requestConsultation = (accountId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield getUserByAccountId(accountId);
    const astrologer = yield astrologer_model_1.Astrologer.findById(payload.astrologer);
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    const existingConsultation = yield consultation_model_1.default.findOne({
        user: user._id,
        astrologer: astrologer._id,
        status: "pending",
    });
    if (existingConsultation) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "You already have a pending consultation request with this astrologer");
    }
    let slotDoc = null;
    let slotIndex = -1;
    if (payload.method === "call") {
        if (!payload.slotId || !payload.bookedSlotId) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Slot information is required for call consultations");
        }
        slotDoc = yield slot_model_1.default.findOne({
            _id: payload.slotId,
            astrologerId: astrologer._id,
            "slots._id": payload.bookedSlotId,
        });
        if (!slotDoc) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Slot not found");
        }
        slotIndex = slotDoc.slots.findIndex((slot) => slot._id.toString() ===
            payload.bookedSlotId);
        if (slotIndex === -1) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Booked slot not found");
        }
        if (slotDoc.slots[slotIndex].isBooked) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "This slot is already booked");
        }
    }
    const consultation = yield consultation_model_1.default.create(Object.assign({ user: user._id, astrologer: astrologer._id, method: payload.method, consultationFor: payload.consultationFor, requestMessage: payload.requestMessage, status: "pending" }, (payload.method === "call" && {
        slotId: new mongoose_1.Types.ObjectId(payload.slotId),
        bookedSlotId: new mongoose_1.Types.ObjectId(payload.bookedSlotId),
    })));
    if (payload.method === "call" &&
        slotDoc &&
        slotIndex !== -1) {
        slotDoc.slots[slotIndex].isBooked =
            true;
        yield slotDoc.save();
    }
    const populatedConsultation = yield consultation_model_1.default.findById(consultation._id)
        .populate("user", "firstName lastName fullName email profilePicture accountId")
        .populate("astrologer", "firstName lastName displayName profilePicture accountId");
    yield (0, sendSingleNotification_1.sendSingleNotification)(accountId, "Consultation Request Sent Successfully", `Your consultation request with ${astrologer.displayName} has been sent successfully. You will be notified once they accept your request.`);
    return populatedConsultation;
});
// Get my consultation requests - User
const getMyConsultationRequests = (accountId_1, ...args_1) => __awaiter(void 0, [accountId_1, ...args_1], void 0, function* (accountId, filters = {}, skip = 0, limit = 10) {
    const user = yield getUserByAccountId(accountId);
    const query = {
        user: user._id,
    };
    if (filters.status &&
        filters.status !== "all") {
        query.status = filters.status;
    }
    if (filters.method &&
        filters.method !== "all") {
        query.method = filters.method;
    }
    if (filters.date) {
        const parsedDate = new Date(filters.date);
        if (!isNaN(parsedDate.getTime())) {
            const startDate = new Date(parsedDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(parsedDate);
            endDate.setHours(23, 59, 59, 999);
            return getConsultationsWithDateFilter(query, startDate, endDate, skip, limit);
        }
    }
    const result = yield (0, infinitePaginate_1.infinitePaginate)(consultation_model_1.default, query, skip, limit, [
        {
            path: "user",
            select: "firstName lastName fullName email profilePicture accountId",
        },
        {
            path: "astrologer",
            select: "firstName lastName displayName profilePicture accountId",
        },
        {
            path: "slotId",
            select: "date slots",
        },
    ]);
    if (result.data &&
        result.data.length > 0) {
        result.data = result.data.map(addBookedSlotDetails);
    }
    return result;
});
// Get my consultation bookings - Astrologer
const getMyConsultationBookings = (accountId_1, ...args_1) => __awaiter(void 0, [accountId_1, ...args_1], void 0, function* (accountId, filters = {}, skip = 0, limit = 10) {
    const astrologer = yield getAstrologerByAccountId(accountId);
    const query = {
        astrologer: astrologer._id,
    };
    if (filters.status &&
        filters.status !== "all") {
        query.status = filters.status;
    }
    if (filters.method &&
        filters.method !== "all") {
        query.method = filters.method;
    }
    if (filters.date) {
        const parsedDate = new Date(filters.date);
        if (!isNaN(parsedDate.getTime())) {
            const startDate = new Date(parsedDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(parsedDate);
            endDate.setHours(23, 59, 59, 999);
            return getConsultationsWithDateFilter(query, startDate, endDate, skip, limit);
        }
    }
    const result = yield (0, infinitePaginate_1.infinitePaginate)(consultation_model_1.default, query, skip, limit, [
        {
            path: "user",
            select: "firstName lastName fullName email profilePicture accountId",
        },
        {
            path: "astrologer",
            select: "firstName lastName displayName profilePicture accountId",
        },
        {
            path: "slotId",
            select: "date slots",
        },
    ]);
    if (result.data &&
        result.data.length > 0) {
        result.data = result.data.map(addBookedSlotDetails);
    }
    return result;
});
const getConsultationsWithDateFilter = (baseQuery, startDate, endDate, skip, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const pipeline = [
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
                                        input: "$slotData.slots",
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
                startTime: "$bookedSlot.startTime",
                endTime: "$bookedSlot.endTime",
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
    const data = yield consultation_model_1.default.aggregate(pipeline);
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
    const countResult = yield consultation_model_1.default.aggregate(countPipeline);
    const total = countResult.length > 0
        ? countResult[0].total
        : 0;
    return {
        data,
        meta: {
            total,
            filteredTotal: total,
            skip,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + data.length < total,
        },
    };
});
// Change consultation status - Astrologer
const changeConsultationStatus = (consultationId, accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologer = yield getAstrologerByAccountId(accountId);
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        astrologer: astrologer._id,
    });
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found or you are not authorized");
    }
    if (consultation.status !== "pending") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `This consultation is already ${consultation.status}`);
    }
    consultation.status = "scheduled";
    consultation.acceptedAt =
        new Date();
    yield consultation.save();
    return consultation_model_1.default.findById(consultation._id)
        .populate("user", "firstName lastName fullName email profilePicture accountId")
        .populate("astrologer", "firstName lastName displayName profilePicture accountId");
});
// Get single consultation
const getSingleConsultation = (consultationId, accountId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const [astrologer, user] = yield Promise.all([
        astrologer_model_1.Astrologer.findOne({
            accountId,
        }),
        user_model_1.User.findOne({
            accountId,
        }),
    ]);
    if (!user && !astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User or astrologer not found");
    }
    const participantQuery = {
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
    const consultation = yield consultation_model_1.default.findOne(participantQuery)
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
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found");
    }
    const consultationObj = addBookedSlotDetails(consultation);
    consultationObj.isCallScheduled =
        !!(consultationObj.method === "call" &&
            ((_a = consultationObj.callSession) === null || _a === void 0 ? void 0 : _a.sessionName) &&
            ((_b = consultationObj.callSession) === null || _b === void 0 ? void 0 : _b.scheduledAt));
    consultationObj.isCallAvailable =
        !!(consultationObj.method === "call" &&
            ((_c = consultationObj.callSession) === null || _c === void 0 ? void 0 : _c.sessionName) &&
            ["scheduled", "ongoing"].includes(consultationObj.status));
    return consultationObj;
});
// Schedule Zoom consultation
const scheduleConsultation = (consultationId, accountId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const astrologer = yield getAstrologerByAccountId(accountId);
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        astrologer: astrologer._id,
    });
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found or not authorized");
    }
    if (consultation.method !== "call") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "This consultation is not a call session");
    }
    // if (consultation.status !== "scheduled") {
    //   throw new AppError(
    //     httpStatus.BAD_REQUEST,
    //     `Consultation must be scheduled before creating the call session`
    //   );
    // }
    if ((_a = consultation.callSession) === null || _a === void 0 ? void 0 : _a.sessionName) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "Call session has already been created");
    }
    console.log(consultation);
    const { slotDoc, bookedSlot, } = yield getBookedSlotDetails(consultation);
    console.log(bookedSlot);
    const scheduledAt = `${slotDoc.date} ${bookedSlot.startTime}-${bookedSlot.endTime}`;
    const duration = "30 mins";
    const sessionName = zoomVideo_service_1.default.generateSessionName(consultation._id.toString());
    consultation.callSession = {
        provider: "zoom_video_sdk",
        sessionName,
        scheduledAt,
    };
    yield consultation.save();
    const user = yield user_model_1.User.findById(consultation.user);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    yield (0, sendSingleNotification_1.sendSingleNotification)(user.accountId, "Consultation Scheduled!", `Your consultation with ${astrologer.displayName} has been scheduled for ${scheduledAt.toLocaleString()}.`);
    yield (0, sendSingleNotification_1.sendSingleNotification)(accountId, "Consultation Scheduled Successfully", `Your consultation with ${user.firstName} has been scheduled for ${scheduledAt.toLocaleString()}.`);
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
});
// Generate Zoom Video SDK credentials for joining
const joinConsultation = (consultationId, accountId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const [user, astrologer] = yield Promise.all([
        user_model_1.User.findOne({
            accountId,
        }),
        astrologer_model_1.Astrologer.findOne({
            accountId,
        }),
    ]);
    if (!user && !astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User or astrologer not found");
    }
    const consultation = yield consultation_model_1.default.findById(consultationId);
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found");
    }
    let participantName;
    let roleType;
    if (user &&
        consultation.user.toString() ===
            user._id.toString()) {
        participantName =
            `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
        roleType = 0;
    }
    else if (astrologer &&
        consultation.astrologer.toString() ===
            astrologer._id.toString()) {
        participantName =
            astrologer.displayName ||
                `${astrologer.firstName || ""} ${astrologer.lastName || ""}`.trim() ||
                "Astrologer";
        roleType = 1;
    }
    else {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You are not a participant in this consultation");
    }
    if (consultation.method !== "call") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "This consultation is not a call session");
    }
    if (!((_a = consultation.callSession) === null || _a === void 0 ? void 0 : _a.sessionName)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Call session has not been scheduled yet");
    }
    if (!["scheduled", "ongoing"].includes(consultation.status)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Consultation cannot be joined while status is ${consultation.status}`);
    }
    const token = zoomVideo_service_1.default.generateToken({
        sessionName: consultation.callSession
            .sessionName,
        roleType,
    });
    return {
        success: true,
        data: {
            provider: "zoom_video_sdk",
            sessionName: consultation.callSession
                .sessionName,
            sessionPassword: consultation.callSession
                .sessionPassword,
            token,
            userName: participantName,
            consultationId: consultation._id,
            scheduledAt: consultation.callSession
                .scheduledAt,
            role: roleType === 1
                ? "astrologer"
                : "user",
        },
    };
});
// Start consultation
const startConsultation = (consultationId, accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologer = yield getAstrologerByAccountId(accountId);
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        astrologer: astrologer._id,
    });
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found or not authorized");
    }
    if (consultation.method !== "call") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "This consultation is not a call session");
    }
    if (!["scheduled", "ongoing"].includes(consultation.status)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Consultation cannot be started while status is ${consultation.status}`);
    }
    if (!consultation.startedAt) {
        consultation.startedAt =
            new Date();
    }
    consultation.status = "ongoing";
    yield consultation.save();
    return consultation;
});
// End consultation session
const endConsultationSession = (consultationId, accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologer = yield astrologer_model_1.Astrologer.findOne({
        accountId,
    });
    const user = yield user_model_1.User.findOne({
        accountId,
    });
    if (!user && !astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User or astrologer not found");
    }
    const participantQuery = {
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
    const consultation = yield consultation_model_1.default.findOne(participantQuery);
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found or you are not authorized");
    }
    if (!["scheduled", "ongoing"].includes(consultation.status)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Cannot end consultation with status ${consultation.status}`);
    }
    consultation.status = "ended";
    consultation.endedAt =
        new Date();
    yield consultation.save();
    return consultation;
});
// Add review
const addReview = (consultationId, accountId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (payload.rating < 1 ||
        payload.rating > 5) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Rating must be between 1 and 5");
    }
    const user = yield getUserByAccountId(accountId);
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        user: user._id,
        status: "ended",
    })
        .populate("astrologer", "accountId")
        .populate("user", "fullName");
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found or not ended yet. You can only review ended consultations.");
    }
    if (consultation.review &&
        consultation.rating) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "You have already reviewed this consultation");
    }
    consultation.review =
        payload.review;
    consultation.rating =
        payload.rating;
    yield consultation.save();
    const astrologer = yield astrologer_model_1.Astrologer.findById(consultation.astrologer);
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    const existingReviewIndex = (_a = astrologer.reviews) === null || _a === void 0 ? void 0 : _a.findIndex((review) => review.user.toString() ===
        user._id.toString());
    if (existingReviewIndex !== undefined &&
        existingReviewIndex !== -1) {
        astrologer.reviews[existingReviewIndex].review = payload.review;
        astrologer.reviews[existingReviewIndex].rating = payload.rating;
        astrologer.reviews[existingReviewIndex].updatedAt = new Date();
    }
    else {
        if (!astrologer.reviews) {
            astrologer.reviews = [];
        }
        astrologer.reviews.push({
            user: user._id,
            review: payload.review,
            rating: payload.rating,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    const totalRating = astrologer.reviews.reduce((sum, review) => sum + review.rating, 0);
    astrologer.rating =
        totalRating /
            astrologer.reviews.length;
    yield astrologer.save();
    const updatedConsultation = yield consultation_model_1.default.findById(consultationId)
        .populate("user", "firstName lastName fullName email profilePicture accountId")
        .populate("astrologer", "firstName lastName displayName profilePicture accountId");
    yield (0, sendSingleNotification_1.sendSingleNotification)((_b = consultation.astrologer) === null || _b === void 0 ? void 0 : _b.accountId, `${(_c = consultation.user) === null || _c === void 0 ? void 0 : _c.fullName} has left a review for you with rating ${payload.rating}`, payload.review);
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
// Send reschedule request
const sendRescheduleRequest = (consultationId, accountId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const user = yield getUserByAccountId(accountId);
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        user: user._id,
    });
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found or not authorized");
    }
    if (consultation.status !==
        "scheduled") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Cannot reschedule: consultation status is ${consultation.status}`);
    }
    if (((_b = (_a = consultation.callSession) === null || _a === void 0 ? void 0 : _a.rescheduleRequest) === null || _b === void 0 ? void 0 : _b.status) === "pending") {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "You already have a pending reschedule request");
    }
    if (!consultation.callSession) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Call session not found");
    }
    consultation.callSession.rescheduleRequest =
        {
            requestedTime: payload.requestedTime,
            reason: payload.reason,
            status: "pending",
        };
    yield consultation.save();
    const astrologer = yield astrologer_model_1.Astrologer.findById(consultation.astrologer);
    yield (0, sendSingleNotification_1.sendSingleNotification)(astrologer === null || astrologer === void 0 ? void 0 : astrologer.accountId, "Reschedule Request Received", `${user.firstName} has requested to reschedule the consultation. Reason: ${payload.reason}`);
    return {
        success: true,
        message: "Reschedule request sent successfully",
        rescheduleRequest: consultation.callSession
            .rescheduleRequest,
    };
});
// Accept or reject reschedule request
const rescheduleConsultation = (consultationId, accountId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const astrologer = yield getAstrologerByAccountId(accountId);
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        astrologer: astrologer._id,
    });
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found or not authorized");
    }
    if (consultation.status !==
        "scheduled") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Cannot reschedule: consultation status is ${consultation.status}`);
    }
    const rescheduleRequest = (_a = consultation.callSession) === null || _a === void 0 ? void 0 : _a.rescheduleRequest;
    if (!rescheduleRequest) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "No reschedule request found");
    }
    if (rescheduleRequest.status !==
        "pending") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "This reschedule request has already been processed");
    }
    const user = yield user_model_1.User.findById(consultation.user);
    if (payload.action === "accept") {
        const newStartTime = new Date(rescheduleRequest.requestedTime);
        if (!consultation.callSession) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Call session not found");
        }
        consultation.callSession.scheduledAt =
            newStartTime;
        rescheduleRequest.status =
            "accepted";
        rescheduleRequest.respondedAt =
            new Date();
        yield consultation.save();
        yield (0, sendSingleNotification_1.sendSingleNotification)(user === null || user === void 0 ? void 0 : user.accountId, "Consultation Rescheduled", `Your consultation has been rescheduled to ${newStartTime.toLocaleString()}.`);
        return {
            success: true,
            message: "Reschedule request accepted",
            newTime: newStartTime,
        };
    }
    const originalTime = (_b = consultation.callSession) === null || _b === void 0 ? void 0 : _b.scheduledAt;
    rescheduleRequest.status =
        "rejected";
    rescheduleRequest.respondedAt =
        new Date();
    yield consultation.save();
    yield (0, sendSingleNotification_1.sendSingleNotification)(user === null || user === void 0 ? void 0 : user.accountId, "Reschedule Request Rejected", "Your reschedule request was not approved. The original consultation time remains unchanged.");
    return {
        success: true,
        message: "Reschedule request rejected",
        originalTime,
    };
});
// Add recommendations
const addRecommendations = (consultationId, accountId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologer = yield getAstrologerByAccountId(accountId);
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        astrologer: astrologer._id,
    });
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found");
    }
    if (consultation.status ===
        "ended") {
        consultation.recommendations =
            payload.recommendations.trim();
        yield consultation.save();
        return {
            success: true,
            message: "Recommendations added successfully",
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
    yield consultation.save();
    return {
        success: true,
        message: "Recommendations added successfully",
        data: consultation,
    };
});
exports.ConsultationServices = {
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

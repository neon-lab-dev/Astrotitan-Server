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
exports.ConsultationChatServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const consultationChat_model_1 = __importDefault(require("./consultationChat.model"));
const consultation_model_1 = __importDefault(require("../consultation/consultation.model"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const socket_1 = require("../../../socket");
const user_model_1 = require("../../users/user.model");
const astrologer_model_1 = require("../../astrologer/astrologer.model");
/* Get Consultation Chat List (Inbox) */
const getConsultationChatList = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("🔍 Getting chat list for accountId:", accountId);
    // ✅ Find user and astrologer by accountId
    const user = yield user_model_1.User.findById(accountId).lean();
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId });
    // console.log("📝 User found:", user?._id);
    // console.log("📝 Astrologer found:", astrologer?._id);
    // ✅ Check if either user or astrologer exists
    if (!user && !astrologer) {
        console.log("❌ No user or astrologer found for accountId:", accountId);
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User or Astrologer not found");
    }
    // ✅ Get the ObjectId of the user or astrologer
    const userId = user === null || user === void 0 ? void 0 : user._id;
    const astrologerId = astrologer === null || astrologer === void 0 ? void 0 : astrologer._id;
    // ✅ Build query with OR conditions
    const orConditions = [];
    if (userId) {
        orConditions.push({ user: userId });
    }
    if (astrologerId) {
        orConditions.push({ astrologer: astrologerId });
    }
    if (orConditions.length === 0) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "No valid user or astrologer found");
    }
    // ✅ Build query to find consultations
    const query = {
        $or: orConditions,
        status: { $in: ["accepted", "pending", "ended"] }
    };
    // console.log("🔍 Consultation query:", JSON.stringify(query, null, 2));
    const consultations = yield consultation_model_1.default.find(query)
        .populate("user", "firstName lastName accountId profilePicture")
        .populate("astrologer", "firstName lastName accountId displayName profilePicture")
        .sort({ updatedAt: -1 })
        .lean();
    // console.log("📊 Consultations found:", consultations.length);
    const chatList = yield Promise.all(consultations.map((consultation) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        // ✅ Get the other participant
        const consultationUserId = consultation.user && typeof consultation.user === "object" && "_id" in consultation.user
            ? consultation.user._id.toString()
            : (_a = consultation.user) === null || _a === void 0 ? void 0 : _a.toString();
        const isUser = userId && consultationUserId === userId.toString();
        const otherUser = isUser ? consultation.astrologer : consultation.user;
        if (!otherUser)
            return null;
        // ✅ Count unread messages for this consultation
        const unreadCount = yield consultationChat_model_1.default.countDocuments({
            consultationId: consultation._id,
            receiver: accountId,
            isRead: false,
        });
        // Get last message
        const lastMessage = yield consultationChat_model_1.default.findOne({
            consultationId: consultation._id,
        })
            .sort({ createdAt: -1 })
            .lean();
        // ✅ Determine the role of the other participant
        const otherUserRole = isUser ? "astrologer" : "user";
        return {
            consultationId: consultation._id,
            consultationStatus: consultation.status,
            method: consultation.method,
            consultationFor: consultation.consultationFor,
            startedAt: consultation.startedAt,
            endedAt: consultation.endedAt,
            participant: {
                _id: otherUser._id,
                name: otherUser.displayName || `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || "User",
                firstName: otherUser.firstName,
                lastName: otherUser.lastName,
                profilePicture: otherUser.profilePicture,
                accountId: otherUser.accountId,
                role: otherUserRole,
            },
            lastMessage: (lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.content) || "No messages yet",
            lastMessageTime: (lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.createdAt) || consultation.createdAt,
            unreadCount: unreadCount,
            isActive: consultation.status === "accepted" || consultation.status === "pending",
        };
    })));
    // Filter out nulls and sort by last message time
    return chatList
        .filter(chat => chat !== null)
        .sort((a, b) => {
        if (!a.lastMessageTime)
            return 1;
        if (!b.lastMessageTime)
            return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });
});
/* Get Messages for a Specific Consultation */
const getConsultationMessages = (consultationId_1, accountId_1, ...args_1) => __awaiter(void 0, [consultationId_1, accountId_1, ...args_1], void 0, function* (consultationId, accountId, skip = 0, limit = 50) {
    // ✅ Build OR conditions for consultation lookup
    const orConditions = [];
    if (accountId) {
        orConditions.push({ user: accountId });
    }
    if (accountId) {
        orConditions.push({ astrologer: accountId });
    }
    if (orConditions.length === 0) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User or Astrologer not found");
    }
    // ✅ Check if user is part of this consultation
    const consultation = yield consultation_model_1.default.findOne({
        _id: consultationId,
        $or: orConditions,
    });
    if (!consultation) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Consultation not found or you are not authorized");
    }
    // ✅ Get messages
    const messages = yield consultationChat_model_1.default.find({
        consultationId: consultationId,
    })
        .populate("sender", "firstName lastName _id accountId profilePicture")
        .populate("receiver", "firstName lastName _id accountId profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    // ✅ Mark messages as read
    yield consultationChat_model_1.default.updateMany({
        consultationId: consultationId,
        receiver: accountId,
        isRead: false,
    }, {
        isRead: true,
        readAt: new Date(),
    });
    return messages.reverse();
});
/* Mark Consultation Messages as Read */
const markConsultationMessagesAsRead = (consultationId, accountId, io) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield consultationChat_model_1.default.updateMany({
        consultationId: consultationId,
        receiver: accountId,
        isRead: false,
    }, {
        isRead: true,
        readAt: new Date(),
    });
    // ✅ Get updated chat list and send via socket
    if (io && result.modifiedCount > 0) {
        const updatedChatList = yield getConsultationChatList(accountId);
        // Get the other participant's accountId
        const consultation = yield consultation_model_1.default.findById(consultationId);
        if (consultation) {
            const otherAccountId = consultation.user.toString() === accountId
                ? consultation.astrologer.toString()
                : consultation.user.toString();
            const otherChatList = yield getConsultationChatList(otherAccountId);
            // Emit to both users
            const socketId = socket_1.userSocketMap.get(accountId);
            const otherSocketId = socket_1.userSocketMap.get(otherAccountId);
            if (socketId) {
                io.to(socketId).emit("updateConsultationChatList", updatedChatList);
            }
            if (otherSocketId) {
                io.to(otherSocketId).emit("updateConsultationChatList", otherChatList);
            }
        }
    }
    return {
        success: true,
        message: "Messages marked as read",
        modifiedCount: result.modifiedCount,
    };
});
exports.ConsultationChatServices = {
    getConsultationChatList,
    getConsultationMessages,
    markConsultationMessagesAsRead,
};

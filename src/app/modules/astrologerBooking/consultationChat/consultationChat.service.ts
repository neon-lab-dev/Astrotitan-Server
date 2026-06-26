/* eslint-disable @typescript-eslint/no-explicit-any */
import ConsultationChat from "./consultationChat.model";
import Consultation from "../consultation/consultation.model";
import AppError from "../../../errors/AppError";
import httpStatus from "http-status";
import { userSocketMap } from "../../../socket";
import { User } from "../../users/user.model";
import { Astrologer } from "../../astrologer/astrologer.model";

/* Get Consultation Chat List (Inbox) */
const getConsultationChatList = async (accountId: string) => {
    console.log("🔍 Getting chat list for accountId:", accountId);

    // Find user and astrologer by accountId
    const user = await User.findById(accountId).lean();
    const astrologer = await Astrologer.findOne({ accountId });

    // console.log("📝 User found:", user?._id);
    // console.log("📝 Astrologer found:", astrologer?._id);

    // Check if either user or astrologer exists
    if (!user && !astrologer) {
        console.log("❌ No user or astrologer found for accountId:", accountId);
        throw new AppError(httpStatus.NOT_FOUND, "User or Astrologer not found");
    }

    // Get the ObjectId of the user or astrologer
    const userId = user?._id;
    const astrologerId = astrologer?._id;

    // Build query with OR conditions
    const orConditions = [];
    if (userId) {
        orConditions.push({ user: userId });
    }
    if (astrologerId) {
        orConditions.push({ astrologer: astrologerId });
    }

    if (orConditions.length === 0) {
        throw new AppError(httpStatus.NOT_FOUND, "No valid user or astrologer found");
    }

    // Build query to find consultations
    const query: any = {
        $or: orConditions,
        status: { $in: ["accepted", "pending", "ended"] }
    };

    // console.log("🔍 Consultation query:", JSON.stringify(query, null, 2));

    const consultations = await Consultation.find(query)
        .populate("user", "firstName lastName accountId profilePicture")
        .populate("astrologer", "firstName lastName accountId displayName profilePicture")
        .sort({ updatedAt: -1 })
        .lean();

    // console.log("📊 Consultations found:", consultations.length);

    const chatList = await Promise.all(
        consultations.map(async (consultation) => {
            // Get the other participant
            const consultationUserId = consultation.user && typeof consultation.user === "object" && "_id" in consultation.user
                ? (consultation.user as any)._id.toString()
                : consultation.user?.toString();
            const isUser = userId && consultationUserId === userId.toString();

            const otherUser: any = isUser ? consultation.astrologer : consultation.user;

            if (!otherUser) return null;

            // Count unread messages for this consultation
            const unreadCount = await ConsultationChat.countDocuments({
                consultationId: consultation._id,
                receiver: accountId,
                isRead: false,
            });

            // Get last message
            const lastMessage = await ConsultationChat.findOne({
                consultationId: consultation._id,
            })
                .sort({ createdAt: -1 })
                .lean();

            // Determine the role of the other participant
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
                lastMessage: lastMessage?.content || "No messages yet",
                lastMessageTime: lastMessage?.createdAt || consultation.createdAt,
                unreadCount: unreadCount,
                isActive: consultation.status === "accepted" || consultation.status === "pending",
            };
        })
    );

    // Filter out nulls and sort by last message time
    return chatList
        .filter(chat => chat !== null)
        .sort((a: any, b: any) => {
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;
            return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });
};

/* Get Messages for a Specific Consultation */
const getConsultationMessages = async (
    consultationId: string,
    accountId: string,
    skip = 0,
    limit = 50
) => {

    const user = await User.findOne({accountId});
    const astrologer = await Astrologer.findOne({accountId});

    // Build OR conditions for consultation lookup
    const orConditions = [];
    if (accountId) {
        orConditions.push({ user: user?._id });
    }
    if (accountId) {
        orConditions.push({ astrologer: astrologer?._id });
    }

   

    // Check if user is part of this consultation
    const consultation = await Consultation.findOne({
        _id: consultationId,
        $or: orConditions,
    });

    if (!consultation) {
        throw new AppError(httpStatus.NOT_FOUND, "Consultation not found or you are not authorized");
    }

    // Get messages
    const messages = await ConsultationChat.find({
        consultationId: consultationId,
    })
        .populate("sender", "firstName lastName _id accountId profilePicture")
        .populate("receiver", "firstName lastName _id accountId profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    // Mark messages as read
    await ConsultationChat.updateMany(
        {
            consultationId: consultationId,
            receiver: accountId,
            isRead: false,
        },
        {
            isRead: true,
            readAt: new Date(),
        }
    );

    return messages.reverse();
};

/* Mark Consultation Messages as Read */
const markConsultationMessagesAsRead = async (
    consultationId: string,
    accountId: string,
    io?: any
) => {
    const result = await ConsultationChat.updateMany(
        {
            consultationId: consultationId,
            receiver: accountId,
            isRead: false,
        },
        {
            isRead: true,
            readAt: new Date(),
        }
    );

    // Get updated chat list and send via socket
    if (io && result.modifiedCount > 0) {
        const updatedChatList = await getConsultationChatList(accountId);

        // Get the other participant's accountId
        const consultation = await Consultation.findById(consultationId);
        if (consultation) {
            const otherAccountId = consultation.user.toString() === accountId
                ? consultation.astrologer.toString()
                : consultation.user.toString();

            const otherChatList = await getConsultationChatList(otherAccountId);

            // Emit to both users
            const socketId = userSocketMap.get(accountId);
            const otherSocketId = userSocketMap.get(otherAccountId);

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
};

export const ConsultationChatServices = {
    getConsultationChatList,
    getConsultationMessages,
    markConsultationMessagesAsRead,
};
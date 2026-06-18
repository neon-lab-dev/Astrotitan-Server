/* eslint-disable @typescript-eslint/no-explicit-any */
import ConsultationChat from "./consultationChat.model";
import Consultation from "../consultation/consultation.model";
import { Accounts } from "../../accounts/accounts.model";
import AppError from "../../../errors/AppError";
import httpStatus from "http-status";
import { userSocketMap } from "../../../socket";

/* Get Consultation Chat List (Inbox) */
const getConsultationChatList = async (accountId: string) => {
    // Find all consultations where user is either user or astrologer
    const user = await Accounts.findById(accountId);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    // Build query to find consultations
    const query: any = {
        $or: [
            { user: accountId },
            { astrologer: accountId }
        ],
        status: { $in: ["accepted", "pending", "ended"] }
    };

    const consultations = await Consultation.find(query)
        .populate("user", "firstName lastName accountId profilePicture")
        .populate("astrologer", "firstName lastName accountId displayName profilePicture")
        .sort({ updatedAt: -1 })
        .lean();

    const chatList = await Promise.all(
        consultations.map(async (consultation) => {
            // Get the other participant
            const getId = (field: any) => {
                if (!field) return null;
                // field may be an ObjectId or a populated object with _id
                if (field._id) return field._id.toString();
                return field.toString();
            };

            const isUser = getId(consultation.user) === accountId;
            const otherUser: any = isUser ? consultation.astrologer : consultation.user;

            if (!otherUser) return null;

            // ✅ Count unread messages for this consultation
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
                    role: isUser ? "astrologer" : "user",
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
    // Check if user is part of this consultation
    const consultation = await Consultation.findOne({
        _id: consultationId,
        $or: [
            { user: accountId },
            { astrologer: accountId }
        ]
    });

    if (!consultation) {
        throw new AppError(httpStatus.NOT_FOUND, "Consultation not found or you are not authorized");
    }

    // Get messages
    const messages = await ConsultationChat.find({
        consultationId: consultationId,
    })
        .populate("sender", "firstName lastName accountId profilePicture")
        .populate("receiver", "firstName lastName accountId profilePicture")
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

    // ✅ Get updated chat list and send via socket
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
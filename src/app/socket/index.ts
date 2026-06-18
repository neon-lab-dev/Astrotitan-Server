/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as SocketIOserver } from "socket.io";
import { Server } from "http";
import Consultation from "../modules/astrologerBooking/consultation/consultation.model";
import ConsultationChat from "../modules/astrologerBooking/consultationChat/consultationChat.model";

export let io: SocketIOserver;
export const userSocketMap = new Map();

const setupSocket = (server: Server) => {
    io = new SocketIOserver(server, {
        cors: {
            origin: ["*"],
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
            credentials: true,
        },
    });

    const sendMessage = async (message: any) => {
        const senderId = typeof message.sender === 'string'
            ? message.sender
            : message.sender?._id;

        const receiverId = typeof message.receiver === 'string'
            ? message.receiver
            : message.receiver?._id;

        const consultationId = message.consultationId;

        // console.log("Sender ID:", senderId);
        // console.log("Receiver ID:", receiverId);
        // console.log("Consultation ID:", consultationId);
        // console.log("Temp ID:", message.tempId);

        const senderSocketId = userSocketMap.get(senderId);
        const receiverSocketId = userSocketMap.get(receiverId);

        try {
            // ✅ Check if consultation exists and is active
            const consultation = await Consultation.findOne({
                _id: consultationId,
                status: { $in: ["accepted", "pending"] }, // Only allow chat if accepted or pending
            });

            if (!consultation) {
                console.log("Consultation not found or not active");
                if (senderSocketId) {
                    io.to(senderSocketId).emit("messageError", {
                        tempId: message.tempId,
                        error: "Consultation not found or not active",
                    });
                }
                return;
            }

            // ✅ Check if sender is part of this consultation
            const isUser = consultation.user.toString() === senderId;
            const isAstrologer = consultation.astrologer.toString() === senderId;

            if (!isUser && !isAstrologer) {
                console.log("Sender is not part of this consultation");
                if (senderSocketId) {
                    io.to(senderSocketId).emit("messageError", {
                        tempId: message.tempId,
                        error: "You are not authorized to send messages in this consultation",
                    });
                }
                return;
            }

            // ✅ Create consultation chat message
            const messageData = {
                consultationId: consultationId,
                sender: senderId,
                receiver: receiverId,
                message: message.content,
                isRead: false,
            };

            const createdMessage = await ConsultationChat.create(messageData);

            // Populate message
            const populatedMessage = await ConsultationChat.findById(createdMessage._id)
                .populate("sender", "_id firstName lastName profilePicture")
                .populate("receiver", "_id firstName lastName profilePicture");

            console.log("✅ Consultation message created:", populatedMessage?._id);

            const responseMessage = {
                ...populatedMessage?.toObject(),
                tempId: message.tempId,
            };

            // ✅ Send to receiver
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receiveConsultationMessage", populatedMessage);
                console.log("📤 Sent to receiver:", receiverId);
            }

            // ✅ Send confirmation to sender
            if (senderSocketId) {
                io.to(senderSocketId).emit("consultationMessageSent", responseMessage);
                console.log("📤 Sent confirmation to sender:", senderId);
            }

            // ✅ If sender is offline, save for later
            if (!senderSocketId) {
                console.log("⚠️ Sender is offline, message saved but not delivered");
            }

        } catch (error) {
            console.error("❌ Error sending consultation message:", error);
            if (senderSocketId) {
                io.to(senderSocketId).emit("messageError", {
                    tempId: message.tempId,
                    error: "Failed to send message",
                });
            }
        }
    };

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId as string;

        if (userId) {
            userSocketMap.set(userId, socket.id);
            console.log(`✅ User connected: ${userId} with socket ID: ${socket.id}`);
            console.log(`📊 Online users: ${userSocketMap.size}`);

            const onlineUsers = Array.from(userSocketMap.keys());
            io.emit("onlineUsers", onlineUsers);
            socket.broadcast.emit("userOnline", userId);
        } else {
            console.log("❌ User ID not provided during connection.");
        }

        // ✅ Handle send consultation message
        socket.on("sendConsultationMessage", (message) => {
            console.log("📩 Received sendConsultationMessage event:", message);
            sendMessage(message);
        });

        // ✅ Handle mark messages as read
        socket.on("markConsultationMessagesRead", async ({ consultationId, userId }) => {
            try {
                await ConsultationChat.updateMany(
                    {
                        consultationId: consultationId,
                        receiver: userId,
                        isRead: false,
                    },
                    { isRead: true, readAt: new Date() }
                );
                console.log(`✅ Messages marked as read for consultation: ${consultationId}`);

                // Notify sender that messages were read
                const senderSocketId = userSocketMap.get(userId);
                if (senderSocketId) {
                    io.to(senderSocketId).emit("consultationMessagesRead", {
                        consultationId,
                        by: userId,
                    });
                }
            } catch (error) {
                console.error("❌ Error marking messages as read:", error);
            }
        });

        // ✅ Handle typing indicator
        socket.on("consultationTyping", ({ consultationId, sender, receiver, isTyping }) => {
            const receiverSocketId = userSocketMap.get(receiver);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("consultationUserTyping", {
                    consultationId,
                    sender,
                    isTyping,
                });
            }
        });

        socket.on("disconnect", () => {
            console.log(`❌ Client Disconnected: ${socket.id}`);
            for (const [userId, socketId] of userSocketMap.entries()) {
                if (socketId === socket.id) {
                    userSocketMap.delete(userId);
                    console.log(`👤 User removed: ${userId}`);
                    socket.broadcast.emit("userOffline", userId);
                    const onlineUsers = Array.from(userSocketMap.keys());
                    io.emit("onlineUsers", onlineUsers);
                    break;
                }
            }
        });
    });

    return io;
};

export default setupSocket;
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as SocketIOserver } from "socket.io";
import { Server } from "http";
import Consultation from "../modules/astrologerBooking/consultation/consultation.model";
import ConsultationChat from "../modules/astrologerBooking/consultationChat/consultationChat.model";
import { ConsultationChatServices } from "../modules/astrologerBooking/consultationChat/consultationChat.service";
import { User } from "../modules/users/user.model";
import { Astrologer } from "../modules/astrologer/astrologer.model";
import { ConsultationServices } from "../modules/astrologerBooking/consultation/consultation.service";

export let io: SocketIOserver;
export const userSocketMap = new Map();

const setupSocket = (server: Server) => {
    io = new SocketIOserver(server, {
        cors: {
            origin: [
                "*"
            ],
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true,
        },
        pingInterval: 25000,
        pingTimeout: 60000,
        transports: ["websocket", "polling"],
    });

    const sendMessage = async (message: any) => {
        const senderId = message.sender;

        const receiverId = message.receiver;

        const consultationId = message.consultationId;

        const senderSocketId = userSocketMap.get(senderId);
        const receiverSocketId = userSocketMap.get(receiverId);

        try {
            // ✅ Find consultation
            const consultation = await Consultation.findOne({
                _id: consultationId,
                status: { $in: ["accepted", "pending"] },
            });

            if (!consultation) {
                console.log("❌ Consultation not found or not active");
                if (senderSocketId) {
                    io.to(senderSocketId).emit("messageError", {
                        tempId: message.tempId,
                        error: "Consultation not found or not active",
                    });
                }
                return;
            }

            const user = await User.findById(consultation?.user);
            const astrologer = await Astrologer.findById(consultation?.astrologer);

            // Check if sender is part of this consultation (now using Account IDs directly)
            const isUser = consultation.user.toString() === user?._id.toString();
            const isAstrologer = consultation.astrologer.toString() === astrologer?._id.toString();

            // console.log("Consultation.user:", consultation.user.toString());
            // console.log("Consultation.astrologer:", consultation.astrologer.toString());
            // console.log("Sender ID:", senderId);
            // console.log("Is User:", isUser);
            // console.log("Is Astrologer:", isAstrologer);

            // console.log("📩 Sender ID:", senderId);
            // console.log("📩 Receiver ID:", receiverId);
            // console.log("📩 Sender Socket ID:", senderSocketId);
            // console.log("📩 Receiver Socket ID:", receiverSocketId);
            // console.log("📊 All online users:", Array.from(userSocketMap.keys()));
            // console.log("📊 userSocketMap size:", userSocketMap.size);

            if (!isUser && !isAstrologer) {
                console.log("❌ Sender is not part of this consultation");
                if (senderSocketId) {
                    io.to(senderSocketId).emit("messageError", {
                        tempId: message.tempId,
                        error: "You are not authorized to send messages",
                    });
                }
                return;
            }

            // Create message with Account IDs
            const messageData = {
                consultationId: consultationId,
                sender: senderId,
                receiver: receiverId,
                content: message.content,
                isRead: false,
            };

            // console.log("📝 Creating message:", messageData);

            const createdMessage = await ConsultationChat.create(messageData);

            // console.log("Message created:", createdMessage._id);

            // Populate message
            const populatedMessage = await ConsultationChat.findById(createdMessage._id)
                .populate("sender", "_id firstName lastName email profilePicture")
                .populate("receiver", "_id firstName lastName email profilePicture");

            const responseMessage = {
                ...populatedMessage?.toObject(),
                tempId: message.tempId,
            };

            // Send to receiver
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receiveConsultationMessage", populatedMessage);
                console.log("📤 Sent to receiver:", receiverId);
            }

            // Send confirmation to sender
            if (senderSocketId) {
                io.to(senderSocketId).emit("consultationMessageSent", responseMessage);
                console.log("📤 Sent confirmation to sender:", senderId);
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
            console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
            console.log(`📊 Online users: ${userSocketMap.size}`);

            // Send initial chat list on connection
            (async () => {
                try {
                    const chatList = await ConsultationChatServices.getConsultationChatList(userId);
                    socket.emit("updateConsultationChatList", chatList);
                } catch (error) {
                    console.error("Error sending initial chat list:", error);
                }
            })();

            const onlineUsers = Array.from(userSocketMap.keys());
            io.emit("onlineUsers", onlineUsers);
            socket.broadcast.emit("userOnline", userId);
        } else {
            console.log("❌ User ID not provided during connection.");
        }

        // Handle send consultation message
        socket.on("sendConsultationMessage", (message) => {
            console.log("📩 Received sendConsultationMessage event:", message);
            sendMessage(message);
        });

        // Handle mark messages as read
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
                console.log(`Messages marked as read for consultation: ${consultationId}`);

                // Update chat list after marking as read
                const updatedChatList = await ConsultationChatServices.getConsultationChatList(userId);

                // Get the other participant's accountId
                const consultation = await Consultation.findById(consultationId);
                if (consultation) {
                    const otherAccountId = consultation.user.toString() === userId
                        ? consultation.astrologer.toString()
                        : consultation.user.toString();

                    const otherChatList = await ConsultationChatServices.getConsultationChatList(otherAccountId);

                    const senderSocketId = userSocketMap.get(userId);
                    const otherSocketId = userSocketMap.get(otherAccountId);

                    if (senderSocketId) {
                        io.to(senderSocketId).emit("updateConsultationChatList", updatedChatList);
                    }
                    if (otherSocketId) {
                        io.to(otherSocketId).emit("updateConsultationChatList", otherChatList);
                    }
                }

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

        // Handle typing indicator
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



        // In socket/index.ts - inside the connection handler

        // ✅ Handle call events
        socket.on('call-start', async (data) => {
            try {
                const { consultationId } = data;
                const userId = socket.handshake.query.userId as string;

                // Call the service directly
                const result = await ConsultationServices.startCall(
                    consultationId,
                    userId
                );

                // Send success response back to caller
                socket.emit('call-started', result);
            } catch (error: any) {
                socket.emit('call-error', { message: error.message });
            }
        });

        socket.on('call-accept', async (data) => {
            try {
                const { consultationId } = data;
                const userId = socket.handshake.query.userId as string;

                const result = await ConsultationServices.acceptCall(consultationId, userId);
                socket.emit('call-accepted-response', result);
            } catch (error: any) {
                socket.emit('call-error', { message: error.message });
            }
        });

        socket.on('call-reject', async (data) => {
            try {
                const { consultationId } = data;
                const userId = socket.handshake.query.userId as string;

                const result = await ConsultationServices.rejectCall(consultationId, userId);
                socket.emit('call-rejected-response', result);
            } catch (error: any) {
                socket.emit('call-error', { message: error.message });
            }
        });

        socket.on('call-end', async (data) => {
            try {
                const { consultationId } = data;
                const userId = socket.handshake.query.userId as string;

                const result = await ConsultationServices.endCall(consultationId, userId);
                socket.emit('call-ended-response', result);
            } catch (error: any) {
                socket.emit('call-error', { message: error.message });
            }
        });
    });

    return io;
};

export default setupSocket;
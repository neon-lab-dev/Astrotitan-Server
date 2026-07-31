/* eslint-disable @typescript-eslint/no-unused-vars */
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
export const userSocketMap = new Map<string, string>();

// ✅ Store active calls for tracking
const activeCalls = new Map<string, {
  callerId: string;
  receiverId: string;
  roomID: string;
  consultationId: string;
  startTime: Date;
  acceptedAt?: Date;
}>();

const setupSocket = (server: Server) => {
    io = new SocketIOserver(server, {
        cors: {
            origin: ["*"],
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true,
        },
        pingInterval: 25000,
        pingTimeout: 60000,
        transports: ["websocket", "polling"],
    });

    // ✅ Send message function (existing)
    const sendMessage = async (message: any) => {
        const senderId = message.sender;
        const receiverId = message.receiver;
        const consultationId = message.consultationId;

        const senderSocketId = userSocketMap.get(senderId);
        const receiverSocketId = userSocketMap.get(receiverId);

        try {
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

            const isUser = consultation.user.toString() === user?._id.toString();
            const isAstrologer = consultation.astrologer.toString() === astrologer?._id.toString();

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

            const messageData = {
                consultationId: consultationId,
                sender: senderId,
                receiver: receiverId,
                content: message.content,
                isRead: false,
            };

            const createdMessage = await ConsultationChat.create(messageData);

            const populatedMessage = await ConsultationChat.findById(createdMessage._id)
                .populate("sender", "_id firstName lastName email profilePicture")
                .populate("receiver", "_id firstName lastName email profilePicture");

            const responseMessage = {
                ...populatedMessage?.toObject(),
                tempId: message.tempId,
            };

            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receiveConsultationMessage", populatedMessage);
                console.log("📤 Sent to receiver:", receiverId);
            }

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
            console.log(`🟢 User connected: ${userId} with socket ID: ${socket.id}`);
            console.log(`📊 Online users: ${userSocketMap.size}`);

            // Send initial chat list
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

        // ============================================================
        // 📞 PEER-TO-PEER CALL HANDLING
        // ============================================================

        // ✅ 1. START CALL - Caller initiates call
        socket.on('call-start', async (data) => {
            try {
                const { consultationId, receiverId, roomID } = data;
                const callerId = socket.handshake.query.userId as string;

                console.log(`📞 ${callerId} is calling ${receiverId}`);
                console.log(`📋 Consultation: ${consultationId}, Room: ${roomID}`);

                // Check if receiver is online
                const receiverSocketId = userSocketMap.get(receiverId);
                if (!receiverSocketId) {
                    console.log(`❌ Receiver ${receiverId} is offline`);
                    socket.emit('call-error', { 
                        message: 'User is offline. Please try again later.' 
                    });
                    return;
                }

                // Call the service to update consultation status
                const result = await ConsultationServices.startCall(
                    consultationId,
                    callerId
                );

                // Store active call
                activeCalls.set(consultationId, {
                    callerId,
                    receiverId,
                    roomID,
                    consultationId,
                    startTime: new Date(),
                });

                // Emit incoming-call to receiver
                io.to(receiverSocketId).emit('incoming-call', {
                    consultationId,
                    callerId,
                    roomID,
                    callerName: result.callerName || 'Someone',
                    timestamp: new Date().toISOString(),
                });

                console.log(`✅ Incoming call sent to: ${receiverId}`);

                // Send success response to caller
                socket.emit('call-started', {
                    success: true,
                    consultationId,
                    roomID,
                    message: 'Call initiated successfully',
                });

            } catch (error: any) {
                console.error('❌ Error starting call:', error);
                socket.emit('call-error', { 
                    message: error.message || 'Failed to start call' 
                });
            }
        });

        // ✅ 2. ACCEPT CALL - Receiver accepts the call
        socket.on('call-accept', async (data) => {
            try {
                const { consultationId } = data;
                const receiverId = socket.handshake.query.userId as string;

                console.log(`✅ ${receiverId} accepted the call`);

                // Get the active call
                const activeCall = activeCalls.get(consultationId);
                if (!activeCall) {
                    console.log(`❌ No active call found for consultation: ${consultationId}`);
                    socket.emit('call-error', { 
                        message: 'No active call found' 
                    });
                    return;
                }

                // Call service to update consultation status
                const result = await ConsultationServices.acceptCall(
                    consultationId,
                    receiverId
                );

                // Update active call status
                activeCalls.set(consultationId, {
                    ...activeCall,
                    acceptedAt: new Date(),
                });

                // Get caller socket
                const callerSocketId = userSocketMap.get(activeCall.callerId);
                if (callerSocketId) {
                    // Emit call-accepted to caller
                    io.to(callerSocketId).emit('call-accepted', {
                        consultationId,
                        roomID: activeCall.roomID,
                        receiverId,
                        receiverName: result.receiverName || 'User',
                        timestamp: new Date().toISOString(),
                    });
                    console.log(`✅ Call accepted notification sent to: ${activeCall.callerId}`);
                } else {
                    console.log(`❌ Caller ${activeCall.callerId} is offline`);
                    socket.emit('call-error', { 
                        message: 'Caller is offline' 
                    });
                    return;
                }

                // Send success response to receiver
                socket.emit('call-accepted-response', {
                    success: true,
                    consultationId,
                    roomID: activeCall.roomID,
                    message: 'Call accepted successfully',
                });

            } catch (error: any) {
                console.error('❌ Error accepting call:', error);
                socket.emit('call-error', { 
                    message: error.message || 'Failed to accept call' 
                });
            }
        });

        // ✅ 3. REJECT CALL - Receiver rejects the call
        socket.on('call-reject', async (data) => {
            try {
                const { consultationId } = data;
                const receiverId = socket.handshake.query.userId as string;

                console.log(`❌ ${receiverId} rejected the call`);

                // Get the active call
                const activeCall = activeCalls.get(consultationId);
                if (!activeCall) {
                    console.log(`❌ No active call found for consultation: ${consultationId}`);
                    socket.emit('call-error', { 
                        message: 'No active call found' 
                    });
                    return;
                }

                // Call service to update consultation status
                await ConsultationServices.rejectCall(consultationId, receiverId);

                // Get caller socket
                const callerSocketId = userSocketMap.get(activeCall.callerId);
                if (callerSocketId) {
                    // Emit call-rejected to caller
                    io.to(callerSocketId).emit('call-rejected', {
                        consultationId,
                        receiverId,
                        timestamp: new Date().toISOString(),
                    });
                    console.log(`❌ Call rejected notification sent to: ${activeCall.callerId}`);
                }

                // Remove active call
                activeCalls.delete(consultationId);

                // Send success response to receiver
                socket.emit('call-rejected-response', {
                    success: true,
                    consultationId,
                    message: 'Call rejected successfully',
                });

            } catch (error: any) {
                console.error('❌ Error rejecting call:', error);
                socket.emit('call-error', { 
                    message: error.message || 'Failed to reject call' 
                });
            }
        });

        // ✅ 4. END CALL - Either participant ends the call
        socket.on('call-end', async (data) => {
            try {
                const { consultationId } = data;
                const userId = socket.handshake.query.userId as string;

                console.log(`📞 ${userId} ended the call`);

                // Get the active call
                const activeCall = activeCalls.get(consultationId);
                
                // Call service to end consultation
                const result = await ConsultationServices.endCall(consultationId, userId);

                // If active call exists, notify the other participant
                if (activeCall) {
                    const otherParticipantId = activeCall.callerId === userId 
                        ? activeCall.receiverId 
                        : activeCall.callerId;

                    const otherSocketId = userSocketMap.get(otherParticipantId);
                    if (otherSocketId) {
                        io.to(otherSocketId).emit('call-ended', {
                            consultationId,
                            endedBy: userId,
                            duration: result.duration || 0,
                            timestamp: new Date().toISOString(),
                        });
                        console.log(`📞 Call ended notification sent to: ${otherParticipantId}`);
                    }

                    // Remove active call
                    activeCalls.delete(consultationId);
                }

                // Send success response to ender
                socket.emit('call-ended-response', {
                    success: true,
                    consultationId,
                    duration: result.duration || 0,
                    message: 'Call ended successfully',
                });

            } catch (error: any) {
                console.error('❌ Error ending call:', error);
                socket.emit('call-error', { 
                    message: error.message || 'Failed to end call' 
                });
            }
        });

        // ✅ 5. CHECK USER ONLINE STATUS
        socket.on('check-user-online', (data) => {
            const { userId } = data;
            const isOnline = userSocketMap.has(userId);
            socket.emit('user-online-status', {
                userId,
                isOnline,
                socketId: isOnline ? userSocketMap.get(userId) : null,
            });
        });

        // ✅ 6. GET ONLINE USERS LIST
        socket.on('get-online-users', () => {
            const onlineUsers = Array.from(userSocketMap.keys());
            socket.emit('online-users-list', onlineUsers);
        });

        // ============================================================
        // 📝 CHAT HANDLING (Existing)
        // ============================================================

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

                const updatedChatList = await ConsultationChatServices.getConsultationChatList(userId);

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

        // ✅ Disconnect handler
        socket.on("disconnect", () => {
            console.log(`❌ Client Disconnected: ${socket.id}`);
            
            // Remove user from map
            let disconnectedUserId: string | null = null;
            for (const [userId, socketId] of userSocketMap.entries()) {
                if (socketId === socket.id) {
                    userSocketMap.delete(userId);
                    disconnectedUserId = userId;
                    console.log(`👤 User removed: ${userId}`);
                    socket.broadcast.emit("userOffline", userId);
                    
                    // Clean up active calls for this user
                    for (const [consultationId, call] of activeCalls.entries()) {
                        if (call.callerId === userId || call.receiverId === userId) {
                            // Notify other participant if call was active
                            const otherParticipantId = call.callerId === userId 
                                ? call.receiverId 
                                : call.callerId;
                            const otherSocketId = userSocketMap.get(otherParticipantId);
                            if (otherSocketId) {
                                io.to(otherSocketId).emit('call-ended', {
                                    consultationId,
                                    endedBy: userId,
                                    reason: 'User disconnected',
                                    timestamp: new Date().toISOString(),
                                });
                            }
                            activeCalls.delete(consultationId);
                            console.log(`🧹 Removed active call for consultation: ${consultationId}`);
                        }
                    }
                    
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
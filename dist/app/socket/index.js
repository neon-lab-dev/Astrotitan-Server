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
exports.userSocketMap = exports.io = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
const socket_io_1 = require("socket.io");
const consultation_model_1 = __importDefault(require("../modules/astrologerBooking/consultation/consultation.model"));
const consultationChat_model_1 = __importDefault(require("../modules/astrologerBooking/consultationChat/consultationChat.model"));
const consultationChat_service_1 = require("../modules/astrologerBooking/consultationChat/consultationChat.service");
const user_model_1 = require("../modules/users/user.model");
const astrologer_model_1 = require("../modules/astrologer/astrologer.model");
const consultation_service_1 = require("../modules/astrologerBooking/consultation/consultation.service");
exports.userSocketMap = new Map();
// ✅ Store active calls for tracking
const activeCalls = new Map();
const setupSocket = (server) => {
    exports.io = new socket_io_1.Server(server, {
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
    const sendMessage = (message) => __awaiter(void 0, void 0, void 0, function* () {
        const senderId = message.sender;
        const receiverId = message.receiver;
        const consultationId = message.consultationId;
        const senderSocketId = exports.userSocketMap.get(senderId);
        const receiverSocketId = exports.userSocketMap.get(receiverId);
        try {
            const consultation = yield consultation_model_1.default.findOne({
                _id: consultationId,
                status: { $in: ["accepted", "pending"] },
            });
            if (!consultation) {
                console.log("❌ Consultation not found or not active");
                if (senderSocketId) {
                    exports.io.to(senderSocketId).emit("messageError", {
                        tempId: message.tempId,
                        error: "Consultation not found or not active",
                    });
                }
                return;
            }
            const user = yield user_model_1.User.findById(consultation === null || consultation === void 0 ? void 0 : consultation.user);
            const astrologer = yield astrologer_model_1.Astrologer.findById(consultation === null || consultation === void 0 ? void 0 : consultation.astrologer);
            const isUser = consultation.user.toString() === (user === null || user === void 0 ? void 0 : user._id.toString());
            const isAstrologer = consultation.astrologer.toString() === (astrologer === null || astrologer === void 0 ? void 0 : astrologer._id.toString());
            if (!isUser && !isAstrologer) {
                console.log("❌ Sender is not part of this consultation");
                if (senderSocketId) {
                    exports.io.to(senderSocketId).emit("messageError", {
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
            const createdMessage = yield consultationChat_model_1.default.create(messageData);
            const populatedMessage = yield consultationChat_model_1.default.findById(createdMessage._id)
                .populate("sender", "_id firstName lastName email profilePicture")
                .populate("receiver", "_id firstName lastName email profilePicture");
            const responseMessage = Object.assign(Object.assign({}, populatedMessage === null || populatedMessage === void 0 ? void 0 : populatedMessage.toObject()), { tempId: message.tempId });
            if (receiverSocketId) {
                exports.io.to(receiverSocketId).emit("receiveConsultationMessage", populatedMessage);
                console.log("📤 Sent to receiver:", receiverId);
            }
            if (senderSocketId) {
                exports.io.to(senderSocketId).emit("consultationMessageSent", responseMessage);
                console.log("📤 Sent confirmation to sender:", senderId);
            }
        }
        catch (error) {
            console.error("❌ Error sending consultation message:", error);
            if (senderSocketId) {
                exports.io.to(senderSocketId).emit("messageError", {
                    tempId: message.tempId,
                    error: "Failed to send message",
                });
            }
        }
    });
    exports.io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId) {
            exports.userSocketMap.set(userId, socket.id);
            console.log(`🟢 User connected: ${userId} with socket ID: ${socket.id}`);
            console.log(`📊 Online users: ${exports.userSocketMap.size}`);
            // Send initial chat list
            (() => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const chatList = yield consultationChat_service_1.ConsultationChatServices.getConsultationChatList(userId);
                    socket.emit("updateConsultationChatList", chatList);
                }
                catch (error) {
                    console.error("Error sending initial chat list:", error);
                }
            }))();
            const onlineUsers = Array.from(exports.userSocketMap.keys());
            exports.io.emit("onlineUsers", onlineUsers);
            socket.broadcast.emit("userOnline", userId);
        }
        else {
            console.log("❌ User ID not provided during connection.");
        }
        // ============================================================
        // 📞 PEER-TO-PEER CALL HANDLING
        // ============================================================
        // ✅ 1. START CALL - Caller initiates call
        socket.on('call-start', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { consultationId, receiverId, roomID } = data;
                const callerId = socket.handshake.query.userId;
                console.log(`📞 ${callerId} is calling ${receiverId}`);
                console.log(`📋 Consultation: ${consultationId}, Room: ${roomID}`);
                // Check if receiver is online
                const receiverSocketId = exports.userSocketMap.get(receiverId);
                if (!receiverSocketId) {
                    console.log(`❌ Receiver ${receiverId} is offline`);
                    socket.emit('call-error', {
                        message: 'User is offline. Please try again later.'
                    });
                    return;
                }
                // Call the service to update consultation status
                const result = yield consultation_service_1.ConsultationServices.startCall(consultationId, callerId);
                // Store active call
                activeCalls.set(consultationId, {
                    callerId,
                    receiverId,
                    roomID,
                    consultationId,
                    startTime: new Date(),
                });
                // Emit incoming-call to receiver
                exports.io.to(receiverSocketId).emit('incoming-call', {
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
            }
            catch (error) {
                console.error('❌ Error starting call:', error);
                socket.emit('call-error', {
                    message: error.message || 'Failed to start call'
                });
            }
        }));
        // ✅ 2. ACCEPT CALL - Receiver accepts the call
        socket.on('call-accept', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { consultationId } = data;
                const receiverId = socket.handshake.query.userId;
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
                const result = yield consultation_service_1.ConsultationServices.acceptCall(consultationId, receiverId);
                // Update active call status
                activeCalls.set(consultationId, Object.assign(Object.assign({}, activeCall), { acceptedAt: new Date() }));
                // Get caller socket
                const callerSocketId = exports.userSocketMap.get(activeCall.callerId);
                if (callerSocketId) {
                    // Emit call-accepted to caller
                    exports.io.to(callerSocketId).emit('call-accepted', {
                        consultationId,
                        roomID: activeCall.roomID,
                        receiverId,
                        receiverName: result.receiverName || 'User',
                        timestamp: new Date().toISOString(),
                    });
                    console.log(`✅ Call accepted notification sent to: ${activeCall.callerId}`);
                }
                else {
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
            }
            catch (error) {
                console.error('❌ Error accepting call:', error);
                socket.emit('call-error', {
                    message: error.message || 'Failed to accept call'
                });
            }
        }));
        // ✅ 3. REJECT CALL - Receiver rejects the call
        socket.on('call-reject', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { consultationId } = data;
                const receiverId = socket.handshake.query.userId;
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
                yield consultation_service_1.ConsultationServices.rejectCall(consultationId, receiverId);
                // Get caller socket
                const callerSocketId = exports.userSocketMap.get(activeCall.callerId);
                if (callerSocketId) {
                    // Emit call-rejected to caller
                    exports.io.to(callerSocketId).emit('call-rejected', {
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
            }
            catch (error) {
                console.error('❌ Error rejecting call:', error);
                socket.emit('call-error', {
                    message: error.message || 'Failed to reject call'
                });
            }
        }));
        // ✅ 4. END CALL - Either participant ends the call
        socket.on('call-end', (data) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { consultationId } = data;
                const userId = socket.handshake.query.userId;
                console.log(`📞 ${userId} ended the call`);
                // Get the active call
                const activeCall = activeCalls.get(consultationId);
                // Call service to end consultation
                const result = yield consultation_service_1.ConsultationServices.endCall(consultationId, userId);
                // If active call exists, notify the other participant
                if (activeCall) {
                    const otherParticipantId = activeCall.callerId === userId
                        ? activeCall.receiverId
                        : activeCall.callerId;
                    const otherSocketId = exports.userSocketMap.get(otherParticipantId);
                    if (otherSocketId) {
                        exports.io.to(otherSocketId).emit('call-ended', {
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
            }
            catch (error) {
                console.error('❌ Error ending call:', error);
                socket.emit('call-error', {
                    message: error.message || 'Failed to end call'
                });
            }
        }));
        // ✅ 5. CHECK USER ONLINE STATUS
        socket.on('check-user-online', (data) => {
            const { userId } = data;
            const isOnline = exports.userSocketMap.has(userId);
            socket.emit('user-online-status', {
                userId,
                isOnline,
                socketId: isOnline ? exports.userSocketMap.get(userId) : null,
            });
        });
        // ✅ 6. GET ONLINE USERS LIST
        socket.on('get-online-users', () => {
            const onlineUsers = Array.from(exports.userSocketMap.keys());
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
        socket.on("markConsultationMessagesRead", (_a) => __awaiter(void 0, [_a], void 0, function* ({ consultationId, userId }) {
            try {
                yield consultationChat_model_1.default.updateMany({
                    consultationId: consultationId,
                    receiver: userId,
                    isRead: false,
                }, { isRead: true, readAt: new Date() });
                console.log(`Messages marked as read for consultation: ${consultationId}`);
                const updatedChatList = yield consultationChat_service_1.ConsultationChatServices.getConsultationChatList(userId);
                const consultation = yield consultation_model_1.default.findById(consultationId);
                if (consultation) {
                    const otherAccountId = consultation.user.toString() === userId
                        ? consultation.astrologer.toString()
                        : consultation.user.toString();
                    const otherChatList = yield consultationChat_service_1.ConsultationChatServices.getConsultationChatList(otherAccountId);
                    const senderSocketId = exports.userSocketMap.get(userId);
                    const otherSocketId = exports.userSocketMap.get(otherAccountId);
                    if (senderSocketId) {
                        exports.io.to(senderSocketId).emit("updateConsultationChatList", updatedChatList);
                    }
                    if (otherSocketId) {
                        exports.io.to(otherSocketId).emit("updateConsultationChatList", otherChatList);
                    }
                }
                const senderSocketId = exports.userSocketMap.get(userId);
                if (senderSocketId) {
                    exports.io.to(senderSocketId).emit("consultationMessagesRead", {
                        consultationId,
                        by: userId,
                    });
                }
            }
            catch (error) {
                console.error("❌ Error marking messages as read:", error);
            }
        }));
        // Handle typing indicator
        socket.on("consultationTyping", ({ consultationId, sender, receiver, isTyping }) => {
            const receiverSocketId = exports.userSocketMap.get(receiver);
            if (receiverSocketId) {
                exports.io.to(receiverSocketId).emit("consultationUserTyping", {
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
            let disconnectedUserId = null;
            for (const [userId, socketId] of exports.userSocketMap.entries()) {
                if (socketId === socket.id) {
                    exports.userSocketMap.delete(userId);
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
                            const otherSocketId = exports.userSocketMap.get(otherParticipantId);
                            if (otherSocketId) {
                                exports.io.to(otherSocketId).emit('call-ended', {
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
                    const onlineUsers = Array.from(exports.userSocketMap.keys());
                    exports.io.emit("onlineUsers", onlineUsers);
                    break;
                }
            }
        });
    });
    return exports.io;
};
exports.default = setupSocket;

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
/* eslint-disable @typescript-eslint/no-explicit-any */
const socket_io_1 = require("socket.io");
const consultation_model_1 = __importDefault(require("../modules/astrologerBooking/consultation/consultation.model"));
const consultationChat_model_1 = __importDefault(require("../modules/astrologerBooking/consultationChat/consultationChat.model"));
const consultationChat_service_1 = require("../modules/astrologerBooking/consultationChat/consultationChat.service");
const user_model_1 = require("../modules/users/user.model");
const astrologer_model_1 = require("../modules/astrologer/astrologer.model");
exports.userSocketMap = new Map();
const setupSocket = (server) => {
    exports.io = new socket_io_1.Server(server, {
        cors: {
            origin: ["*"],
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
            credentials: true,
        },
    });
    const sendMessage = (message) => __awaiter(void 0, void 0, void 0, function* () {
        const senderId = message.sender;
        const receiverId = message.receiver;
        const consultationId = message.consultationId;
        const senderSocketId = exports.userSocketMap.get(senderId);
        const receiverSocketId = exports.userSocketMap.get(receiverId);
        try {
            // ✅ Find consultation
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
            // Check if sender is part of this consultation (now using Account IDs directly)
            const isUser = consultation.user.toString() === (user === null || user === void 0 ? void 0 : user._id.toString());
            const isAstrologer = consultation.astrologer.toString() === (astrologer === null || astrologer === void 0 ? void 0 : astrologer._id.toString());
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
                    exports.io.to(senderSocketId).emit("messageError", {
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
            const createdMessage = yield consultationChat_model_1.default.create(messageData);
            // console.log("Message created:", createdMessage._id);
            // Populate message
            const populatedMessage = yield consultationChat_model_1.default.findById(createdMessage._id)
                .populate("sender", "_id firstName lastName email profilePicture")
                .populate("receiver", "_id firstName lastName email profilePicture");
            const responseMessage = Object.assign(Object.assign({}, populatedMessage === null || populatedMessage === void 0 ? void 0 : populatedMessage.toObject()), { tempId: message.tempId });
            // Send to receiver
            if (receiverSocketId) {
                exports.io.to(receiverSocketId).emit("receiveConsultationMessage", populatedMessage);
                console.log("📤 Sent to receiver:", receiverId);
            }
            // Send confirmation to sender
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
            console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
            console.log(`📊 Online users: ${exports.userSocketMap.size}`);
            // Send initial chat list on connection
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
                // Update chat list after marking as read
                const updatedChatList = yield consultationChat_service_1.ConsultationChatServices.getConsultationChatList(userId);
                // Get the other participant's accountId
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
                // Notify sender that messages were read
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
        socket.on("disconnect", () => {
            console.log(`❌ Client Disconnected: ${socket.id}`);
            for (const [userId, socketId] of exports.userSocketMap.entries()) {
                if (socketId === socket.id) {
                    exports.userSocketMap.delete(userId);
                    console.log(`👤 User removed: ${userId}`);
                    socket.broadcast.emit("userOffline", userId);
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

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
        var _a, _b;
        const senderId = typeof message.sender === 'string'
            ? message.sender
            : (_a = message.sender) === null || _a === void 0 ? void 0 : _a._id;
        const receiverId = typeof message.receiver === 'string'
            ? message.receiver
            : (_b = message.receiver) === null || _b === void 0 ? void 0 : _b._id;
        const consultationId = message.consultationId;
        // console.log("Sender ID:", senderId);
        // console.log("Receiver ID:", receiverId);
        // console.log("Consultation ID:", consultationId);
        // console.log("Temp ID:", message.tempId);
        const senderSocketId = exports.userSocketMap.get(senderId);
        const receiverSocketId = exports.userSocketMap.get(receiverId);
        try {
            // ✅ Check if consultation exists and is active
            const consultation = yield consultation_model_1.default.findOne({
                _id: consultationId,
                status: { $in: ["accepted", "pending"] }, // Only allow chat if accepted or pending
            });
            if (!consultation) {
                console.log("Consultation not found or not active");
                if (senderSocketId) {
                    exports.io.to(senderSocketId).emit("messageError", {
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
                    exports.io.to(senderSocketId).emit("messageError", {
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
            const createdMessage = yield consultationChat_model_1.default.create(messageData);
            // Populate message
            const populatedMessage = yield consultationChat_model_1.default.findById(createdMessage._id)
                .populate("sender", "_id firstName lastName profilePicture")
                .populate("receiver", "_id firstName lastName profilePicture");
            console.log("✅ Consultation message created:", populatedMessage === null || populatedMessage === void 0 ? void 0 : populatedMessage._id);
            const responseMessage = Object.assign(Object.assign({}, populatedMessage === null || populatedMessage === void 0 ? void 0 : populatedMessage.toObject()), { tempId: message.tempId });
            // ✅ Send to receiver
            if (receiverSocketId) {
                exports.io.to(receiverSocketId).emit("receiveConsultationMessage", populatedMessage);
                console.log("📤 Sent to receiver:", receiverId);
            }
            // ✅ Send confirmation to sender
            if (senderSocketId) {
                exports.io.to(senderSocketId).emit("consultationMessageSent", responseMessage);
                console.log("📤 Sent confirmation to sender:", senderId);
            }
            // ✅ If sender is offline, save for later
            if (!senderSocketId) {
                console.log("⚠️ Sender is offline, message saved but not delivered");
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
            console.log(`✅ User connected: ${userId} with socket ID: ${socket.id}`);
            console.log(`📊 Online users: ${exports.userSocketMap.size}`);
            const onlineUsers = Array.from(exports.userSocketMap.keys());
            exports.io.emit("onlineUsers", onlineUsers);
            socket.broadcast.emit("userOnline", userId);
        }
        else {
            console.log("❌ User ID not provided during connection.");
        }
        // ✅ Handle send consultation message
        socket.on("sendConsultationMessage", (message) => {
            console.log("📩 Received sendConsultationMessage event:", message);
            sendMessage(message);
        });
        // ✅ Handle mark messages as read
        socket.on("markConsultationMessagesRead", (_a) => __awaiter(void 0, [_a], void 0, function* ({ consultationId, userId }) {
            try {
                yield consultationChat_model_1.default.updateMany({
                    consultationId: consultationId,
                    receiver: userId,
                    isRead: false,
                }, { isRead: true, readAt: new Date() });
                console.log(`✅ Messages marked as read for consultation: ${consultationId}`);
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
        // ✅ Handle typing indicator
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SocketManager {
    constructor() {
        this.io = null;
        this.connectedUsers = {}; // userId: socketId
    }
    static getInstance() {
        if (!SocketManager.instance) {
            SocketManager.instance = new SocketManager();
        }
        return SocketManager.instance;
    }
    initialize(ioInstance) {
        this.io = ioInstance;
        this.io.on('connection', (socket) => {
            console.log('Socket connected:', socket.id);
            // Listen for user registration
            socket.on('register-user', (userId) => {
                if (userId) {
                    socket.userId = userId;
                    this.connectedUsers[userId] = socket.id;
                    console.log(`User ${userId} registered with socket ${socket.id}`);
                }
            });
            // Clean up on disconnect
            socket.on('disconnect', () => {
                if (socket.userId) {
                    delete this.connectedUsers[socket.userId];
                }
            });
        });
    }
    getConnectedUsers() {
        return this.connectedUsers;
    }
    getIoInstance() {
        return this.io;
    }
}
exports.default = SocketManager.getInstance();

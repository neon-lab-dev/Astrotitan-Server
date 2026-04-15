// src/app/socketManager.ts
import { Server as SocketIOServer, Socket } from 'socket.io';

interface UserSocket extends Socket {
  userId?: string;
}

class SocketManager {
  private static instance: SocketManager;
  public io: SocketIOServer | null = null;
  public connectedUsers: Record<string, string> = {}; // userId: socketId

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public initialize(ioInstance: SocketIOServer): void {
    this.io = ioInstance;

    this.io.on('connection', (socket: UserSocket) => {
      console.log('Socket connected:', socket.id);

      // Listen for user registration
      socket.on('register-user', (userId: string) => {
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

  public getConnectedUsers(): Record<string, string> {
    return this.connectedUsers;
  }

  public getIoInstance(): SocketIOServer | null {
    return this.io;
  }
}

export default SocketManager.getInstance();
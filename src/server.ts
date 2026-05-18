import http from "http";
import app from "./app";
import config from "./app/config";
import mongoose from "mongoose";
import { Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
// import { registerCrons } from "./cron";
// import { registerOldNotificationCleanupCron } from "./app/utils/cleanOldNotifications";

let server: Server;
export let io: SocketIOServer;

async function main() {
  try {
    await mongoose.connect(config.db_url as string);

    server = http.createServer(app);

    // registerCrons();
    // registerOldNotificationCleanupCron();

    io = new SocketIOServer(server, {
      cors: {
        origin: [
          "http://192.168.0.102:5000", // Your local network IP
          "http://localhost:19000", // React Native default
          "http://localhost:19006", // Common React Native port
          "http://192.168.0.102:19000", // Your local network IP
          "http://192.168.0.102:19006",
          "http://localhost:5173",
          "http://localhost:5000",
          "https://astro-titan-admin-panel.vercel.app",
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
      },
      pingInterval: 25000,
      pingTimeout: 60000,
      transports: ["websocket", "polling"],
    });

    // 🔐 Socket authentication + room join
    io.on("connection", (socket: Socket) => {
      const { userId } = socket.handshake.auth;

      // console.log("🔌 Socket connected:", socket.id);
      // console.log("👤 userId:", userId);

      if (!userId) {
        console.warn("❌ No userId, disconnecting");
        socket.disconnect(true);
        return;
      }

      socket.join(userId.toString());
      console.log(`✅ User ${userId} joined room ${userId}`);

      socket.on("disconnect", (reason) => {
        console.log(`❌ Socket ${socket.id} disconnected:`, reason);
      });
    });

    server.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📡 Socket.IO listening on ws://localhost:${config.port}`);
    });

    io.engine.on("connection_error", (err) => {
      console.error("🚫 Engine connection error:", err);
    });
  } catch (err) {
    console.error("🔥 Server startup error:", err);
    process.exit(1);
  }
}

main();

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

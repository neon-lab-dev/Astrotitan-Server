import http from "http";
import app from "./app";
import config from "./app/config";
import mongoose from "mongoose";
import { Server } from "http";
import setupSocket from "./app/socket";
import { runConsultationReminderCron } from "./app/cron/consultationReminder.cron";

let server: Server;

async function main() {
  try {
    await mongoose.connect(config.db_url as string);

    server = http.createServer(app);

     runConsultationReminderCron();

     setupSocket(server);

    server.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
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
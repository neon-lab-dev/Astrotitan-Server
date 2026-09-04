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
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./app/config"));
const mongoose_1 = __importDefault(require("mongoose"));
const socket_1 = __importDefault(require("./app/socket"));
const consultationReminder_cron_1 = require("./app/cron/consultationReminder.cron");
let server;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(config_1.default.db_url);
            server = http_1.default.createServer(app_1.default);
            (0, consultationReminder_cron_1.runConsultationReminderCron)();
            (0, socket_1.default)(server);
            server.listen(config_1.default.port, () => {
                console.log(`🚀 Server running on port ${config_1.default.port}`);
            });
        }
        catch (err) {
            console.error("🔥 Server startup error:", err);
            process.exit(1);
        }
    });
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

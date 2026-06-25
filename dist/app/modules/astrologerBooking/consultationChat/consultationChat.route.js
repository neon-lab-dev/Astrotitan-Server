"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultationChatRoutes = void 0;
const express_1 = __importDefault(require("express"));
const consultationChat_controller_1 = require("./consultationChat.controller");
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const accounts_constants_1 = require("../../accounts/accounts.constants");
const router = express_1.default.Router();
// All routes require authentication
router.use((0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer));
// Get consultation chat list (inbox)
router.get("/chat-list", consultationChat_controller_1.ConsultationChatControllers.getConsultationChatList);
// Get messages for a specific consultation
router.get("/messages/:consultationId", consultationChat_controller_1.ConsultationChatControllers.getConsultationMessages);
// Mark messages as read in a consultation
router.patch("/read/:consultationId", consultationChat_controller_1.ConsultationChatControllers.markConsultationMessagesAsRead);
exports.ConsultationChatRoutes = router;

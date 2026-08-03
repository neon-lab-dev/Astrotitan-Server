"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const consultation_controller_1 = require("./consultation.controller");
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const accounts_constants_1 = require("../../accounts/accounts.constants");
const router = express_1.default.Router();
// User Routes
router.post("/request", (0, auth_1.default)(accounts_constants_1.UserRole.user), consultation_controller_1.ConsultationControllers.requestConsultation);
router.get("/my-requests", (0, auth_1.default)(accounts_constants_1.UserRole.user), consultation_controller_1.ConsultationControllers.getMyConsultationRequests);
// Astrologer Routes
router.get("/my-bookings", (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.getMyConsultationBookings);
router.patch("/change-status/:consultationId", (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.changeConsultationStatus);
router.patch("/end-session/:consultationId", (0, auth_1.default)(accounts_constants_1.UserRole.astrologer, accounts_constants_1.UserRole.user), consultation_controller_1.ConsultationControllers.endConsultationSession);
router.post("/review/add/:consultationId", (0, auth_1.default)(accounts_constants_1.UserRole.user), consultation_controller_1.ConsultationControllers.addReview);
router.post('/schedule-meeting/:consultationId', (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.scheduleMeeting);
router.post('/send-reschedule-request/:consultationId', (0, auth_1.default)(accounts_constants_1.UserRole.user), consultation_controller_1.ConsultationControllers.sendRescheduleRequest);
router.patch('/reschedule-meeting/:consultationId', (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.rescheduleMeeting);
// Common Routes (Both User and Astrologer)
router.get("/:consultationId", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.getSingleConsultation);
router.post('/add-recommendations/:consultationId', (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.addRecommendations);
exports.ConsultationRoutes = router;

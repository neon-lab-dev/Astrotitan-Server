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
// User routes
router.post("/request", (0, auth_1.default)(accounts_constants_1.UserRole.user), consultation_controller_1.ConsultationControllers.requestConsultation);
router.get("/my-requests", (0, auth_1.default)(accounts_constants_1.UserRole.user), consultation_controller_1.ConsultationControllers.getMyConsultationRequests);
router.post("/send-reschedule-request/:consultationId", (0, auth_1.default)(accounts_constants_1.UserRole.user), consultation_controller_1.ConsultationControllers.sendRescheduleRequest);
router.post("/review/add/:consultationId", (0, auth_1.default)(accounts_constants_1.UserRole.user), consultation_controller_1.ConsultationControllers.addReview);
// Astrologer routes
router.get("/my-bookings", (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.getMyConsultationBookings);
router.post("/schedule/:consultationId", (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.scheduleConsultation);
router.patch("/reject/:consultationId", (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.rejectConsultation);
router.patch("/start/:consultationId", (0, auth_1.default)(accounts_constants_1.UserRole.astrologer, accounts_constants_1.UserRole.user), consultation_controller_1.ConsultationControllers.startConsultation);
router.patch("/reschedule/:consultationId", (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.rescheduleConsultation);
router.post("/add-recommendations/:consultationId", (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.addRecommendations);
// Common routes
router.get("/join/:consultationId", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.joinConsultation);
router.patch("/end-session/:consultationId", (0, auth_1.default)(accounts_constants_1.UserRole.astrologer, accounts_constants_1.UserRole.user), consultation_controller_1.ConsultationControllers.endConsultationSession);
router.get("/:consultationId", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.getSingleConsultation);
exports.ConsultationRoutes = router;

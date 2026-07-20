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
// Common Routes (Both User and Astrologer)
router.get("/:consultationId", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.getSingleConsultation);
// user token
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YTRkZTMxODkzNGMwZjVhYTYxMDc4MzEiLCJlbWFpbCI6InJhaHVsY2hhbmRyYXN1dHJhZGhhcjNAZ21haWwuY29tIiwicGhvbmVOdW1iZXIiOm51bGwsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzg0MDA4MDc2LCJleHAiOjE3ODQ2MTI4NzZ9.Rrc_GUmBzuNVHEv-VSUBqDHVI7OsUkYDEOFcy3qOvaA
// Astorloger token
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YTM4YjhhYTBkZjhhMzZkZDc5MmI1ZGEiLCJlbWFpbCI6InJhaHVsc2QzODBAZ21haWwuY29tIiwicGhvbmVOdW1iZXIiOiIrOTE5ODc2NTQzMjE1Iiwicm9sZSI6ImFzdHJvbG9nZXIiLCJpYXQiOjE3ODQwMDgxNTAsImV4cCI6MTc4NDYxMjk1MH0.v8CvJMzTMqS3SjPc4aWN-anXSnot_R_vipWM1ass1Cw
// Call Routes
router.post('/call/test', (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.testTwilioCredentials);
router.post('/call/start', (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.startCall);
router.post('/call/accept', (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.acceptCall);
router.post('/call/reject', (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.rejectCall);
router.post('/call/end', (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.endCall);
router.get('/call/token/:consultationId', (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.getCallToken);
router.get('/call/status/:consultationId', (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), consultation_controller_1.ConsultationControllers.getCallStatus);
exports.ConsultationRoutes = router;

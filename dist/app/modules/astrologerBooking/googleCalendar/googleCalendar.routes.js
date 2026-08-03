"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const accounts_constants_1 = require("../../accounts/accounts.constants");
const googleCalendar_controller_1 = require("./googleCalendar.controller");
const router = express_1.default.Router();
// Get OAuth URL to connect Google Calendar
router.get('/auth-url', (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), googleCalendar_controller_1.GoogleCalendarController.getAuthUrl);
// OAuth callback - exchange code for tokens
router.get('/oauth-callback', googleCalendar_controller_1.GoogleCalendarController.handleCallback);
// Get connection status
router.get('/status', (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), googleCalendar_controller_1.GoogleCalendarController.getConnectionStatus);
// Disconnect calendar
router.delete('/disconnect', (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), googleCalendar_controller_1.GoogleCalendarController.disconnectCalendar);
exports.GoogleCalendarRoutes = router;

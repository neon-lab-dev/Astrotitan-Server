"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioRoutes = void 0;
// src/app/modules/twilio/twilio.route.ts
const express_1 = __importDefault(require("express"));
const twilio_controller_1 = require("./twilio.controller");
const router = express_1.default.Router();
// ✅ This is the route Twilio will call
// No auth middleware here - it's called by Twilio, not your users
router.post('/voice', twilio_controller_1.TwilioControllers.handleVoiceWebhook);
// ✅ Optional: Status callback route
router.post('/call-status', twilio_controller_1.TwilioControllers.handleStatusCallback);
// ✅ Optional: Recording callback route
router.post('/recording', twilio_controller_1.TwilioControllers.handleRecordingWebhook);
exports.TwilioRoutes = router;

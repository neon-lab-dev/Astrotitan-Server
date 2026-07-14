// src/app/modules/twilio/twilio.route.ts
import express from 'express';
import { TwilioControllers } from './twilio.controller';

const router = express.Router();

// ✅ This is the route Twilio will call
// No auth middleware here - it's called by Twilio, not your users
router.post('/voice', TwilioControllers.handleVoiceWebhook);

// ✅ Optional: Status callback route
router.post('/call-status', TwilioControllers.handleStatusCallback);

// ✅ Optional: Recording callback route
router.post('/recording', TwilioControllers.handleRecordingWebhook);

export const TwilioRoutes = router;
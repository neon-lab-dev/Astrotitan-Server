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
exports.TwilioControllers = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const twilio_service_1 = require("./twilio.service");
// ✅ Voice Webhook Handler - Returns TwiML
const handleVoiceWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get call details from Twilio
        const { CallSid, From, To, CallStatus } = req.body;
        console.log('📞 Incoming call webhook:', {
            CallSid,
            From,
            To,
            CallStatus,
        });
        // Generate TwiML response using the service
        const twimlResponse = yield (0, twilio_service_1.twilioWebhookHandler)(req.body);
        // Set content type to XML for Twilio
        res.set('Content-Type', 'text/xml');
        res.send(twimlResponse);
    }
    catch (error) {
        console.error('❌ Error in voice webhook:', error);
        // Fallback TwiML
        const fallbackTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">We're sorry, something went wrong. Please try again later.</Say>
  <Hangup />
</Response>`;
        res.set('Content-Type', 'text/xml');
        res.status(500).send(fallbackTwiML);
    }
});
// ✅ Status Callback Webhook
const handleStatusCallback = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { CallSid, CallStatus, Duration, From, To } = req.body;
    console.log('📊 Call status update:', {
        CallSid,
        CallStatus,
        Duration,
        From,
        To,
    });
    // Update your database with call status
    // await Consultation.findOneAndUpdate(
    //   { callRoomId: CallSid },
    //   { callStatus: CallStatus, callDuration: Duration }
    // );
    res.status(200).send('OK');
}));
// ✅ Recording Webhook (if you want to record calls)
const handleRecordingWebhook = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { RecordingSid, CallSid, RecordingUrl, RecordingDuration } = req.body;
    console.log('🎙️ Call recording received:', {
        RecordingSid,
        CallSid,
        RecordingUrl,
        RecordingDuration,
    });
    // Save recording URL to database
    // await Consultation.findOneAndUpdate(
    //   { callRoomId: CallSid },
    //   { recordingUrl: RecordingUrl }
    // );
    res.status(200).send('OK');
}));
exports.TwilioControllers = {
    handleVoiceWebhook,
    handleStatusCallback,
    handleRecordingWebhook,
};

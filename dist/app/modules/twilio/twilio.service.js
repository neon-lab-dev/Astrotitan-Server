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
exports.handleRecording = exports.generateWaitMusic = exports.twilioWebhookHandler = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const VoiceResponse_1 = __importDefault(require("twilio/lib/twiml/VoiceResponse"));
// ✅ Handle incoming call and generate TwiML
const twilioWebhookHandler = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const twiml = new VoiceResponse_1.default();
    const { To, From, CallSid } = payload;
    console.log('📞 Generating TwiML for:', { To, From, CallSid });
    // ✅ Option 1: Simple greeting
    twiml.say({
        voice: 'alice',
    }, 'Hello! This is Astrotitan connecting your call.');
    // ✅ Option 2: Connect to the other participant
    // Uncomment this when you have phone numbers configured
    // twiml.dial({
    //   callerId: process.env.TWILIO_PHONE_NUMBER,
    //   action: '/api/v1/twilio/call-status',
    //   method: 'POST',
    // }, (dial) => {
    //   dial.number({
    //     statusCallback: '/api/v1/twilio/call-status',
    //     statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    //   }, '+1234567890'); // Replace with actual number
    // });
    // ✅ Option 3: Conference (for multiple participants)
    // twiml.conference({
    //   startConferenceOnEnter: true,
    //   endConferenceOnExit: true,
    //   waitUrl: '/api/v1/twilio/wait-music',
    // }, 'consultation-room');
    return twiml.toString();
});
exports.twilioWebhookHandler = twilioWebhookHandler;
// ✅ Generate TwiML for waiting music
const generateWaitMusic = () => {
    const twiml = new VoiceResponse_1.default();
    twiml.say({
        voice: 'alice',
    }, 'Please wait while we connect you to your astrologer.');
    twiml.play({
        loop: 3,
    }, 'https://api.twilio.com/cowbell.mp3');
    twiml.say({
        voice: 'alice',
    }, 'Your astrologer will be with you shortly.');
    return twiml.toString();
};
exports.generateWaitMusic = generateWaitMusic;
// ✅ Handle call recording
const handleRecording = (recordingUrl, callSid) => {
    console.log('🎙️ Recording URL:', recordingUrl);
    console.log('📞 Call SID:', callSid);
    // Update consultation with recording URL
    // await Consultation.findOneAndUpdate(
    //   { callRoomId: callSid },
    //   { recordingUrl: recordingUrl }
    // );
};
exports.handleRecording = handleRecording;

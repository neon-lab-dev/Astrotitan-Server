/* eslint-disable @typescript-eslint/no-explicit-any */
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';

// ✅ Handle incoming call and generate TwiML
export const twilioWebhookHandler = async (payload: any): Promise<string> => {
  const twiml = new VoiceResponse();

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
};

// ✅ Generate TwiML for waiting music
export const generateWaitMusic = (): string => {
  const twiml = new VoiceResponse();
  
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

// ✅ Handle call recording
export const handleRecording = (recordingUrl: string, callSid: string) => {
  console.log('🎙️ Recording URL:', recordingUrl);
  console.log('📞 Call SID:', callSid);
  
  // Update consultation with recording URL
  // await Consultation.findOneAndUpdate(
  //   { callRoomId: callSid },
  //   { recordingUrl: recordingUrl }
  // );
};
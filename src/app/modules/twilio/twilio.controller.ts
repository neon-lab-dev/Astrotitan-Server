/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { twilioWebhookHandler as twilioServiceHandler } from './twilio.service';

// ✅ Voice Webhook Handler - Returns TwiML
const handleVoiceWebhook = async (req: Request, res: Response) => {
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
    const twimlResponse = await twilioServiceHandler(req.body);

    // Set content type to XML for Twilio
    res.set('Content-Type', 'text/xml');
    res.send(twimlResponse);
  } catch (error) {
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
};

// ✅ Status Callback Webhook
const handleStatusCallback = catchAsync(async (req: Request, res: Response) => {
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
});

// ✅ Recording Webhook (if you want to record calls)
const handleRecordingWebhook = catchAsync(async (req: Request, res: Response) => {
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
});

export const TwilioControllers = {
  handleVoiceWebhook,
  handleStatusCallback,
  handleRecordingWebhook,
};
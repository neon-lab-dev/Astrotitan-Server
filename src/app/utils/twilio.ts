/* eslint-disable @typescript-eslint/no-explicit-any */
import twilio from 'twilio';
import config from '../config';

const accountSid = config.twilio_account_sid;
const authToken = config.twilio_auth_token;
const apiKey = config.twilio_api_key;
const apiSecret = config.twilio_api_secret;
const twimlAppSid = config.twilio_twiml_app_sid;

const client = twilio(accountSid, authToken);

// ✅ FIXED: Generate Access Token with correct method
export const generateTwilioAccessToken = (identity: string, roomName: string) => {
  // ✅ Use the correct AccessToken from twilio.jwt
  const AccessToken = twilio.jwt.AccessToken;
  const VideoGrant = AccessToken.VideoGrant;
  const VoiceGrant = AccessToken.VoiceGrant;

  // ✅ CORRECT way to create token with API Key
  const token = new AccessToken(
    accountSid,  // ✅ Account SID (issuer)
    apiKey,      // ✅ API Key SID (SK...)
    apiSecret,   // ✅ API Key Secret
    {
      identity: identity,
      ttl: 3600,
    }
  );

  // ✅ Add Video Grant
  if (roomName) {
    const videoGrant = new VideoGrant({
      room: roomName,
    });
    token.addGrant(videoGrant);
  }

  // ✅ Add Voice Grant (if twimlAppSid is available)
  if (twimlAppSid) {
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    });
    token.addGrant(voiceGrant);
  }

  // ✅ Generate the JWT
  const jwtToken = token.toJwt();
  
  // ✅ Debug: Decode and log the token payload
  try {
    const parts = jwtToken.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('🔑 Token payload:', {
        iss: payload.iss,
        sub: payload.sub,
        identity: payload.grants?.identity,
        hasVideoGrant: !!payload.grants?.video,
        room: payload.grants?.video?.room,
      });
    }
  } catch (e) {
    console.log('⚠️ Could not decode token');
  }

  return jwtToken;
};

// Create a Twilio Video Room
export const createRoom = async (roomName: string) => {
  try {
    const room = await client.video.rooms.create({
      uniqueName: roomName,
      type: 'group',
      recordParticipantsOnConnect: false,
      statusCallback: `${process.env.YOUR_DOMAIN}/api/v1/twilio/call-status`,
    });
    console.log('✅ Room created:', room.sid);
    return room;
  } catch (error: any) {
    console.error('❌ Error creating room:', error);
    throw new Error(error.message || 'Failed to create room');
  }
};

// End/Complete a room
export const endRoom = async (roomName: string) => {
  try {
    const room = await client.video.rooms(roomName).update({ status: 'completed' });
    console.log('✅ Room ended:', room.sid);
    return room;
  } catch (error: any) {
    console.error('❌ Error ending room:', error);
    throw new Error(error.message || 'Failed to end room');
  }
};

// Get room status
export const getRoomStatus = async (roomName: string) => {
  try {
    const room = await client.video.rooms(roomName).fetch();
    return room;
  } catch (error: any) {
    console.error('❌ Error fetching room:', error);
    return null;
  }
};
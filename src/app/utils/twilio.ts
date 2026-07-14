/* eslint-disable @typescript-eslint/no-explicit-any */
import twilio from 'twilio';
import config from '../config';

const accountSid = config.twilio_account_sid;
const authToken = config.twilio_auth_token;
const apiKey = config.twilio_api_key;
const apiSecret = config.twilio_api_secret;
const twimlAppSid = config.twilio_twiml_app_sid;

const client = twilio(accountSid, authToken);

// Generate Access Token for a user
export const generateTwilioAccessToken = (identity: string, roomName: string) => {
  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;
  const VideoGrant = AccessToken.VideoGrant;

  // Voice Grant for audio calls
  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: true,
  });

  // Video Grant for video calls (optional)
  const videoGrant = new VideoGrant({
    room: roomName,
  });

  const token = new AccessToken(accountSid, apiKey, apiSecret, {
    identity: identity,
    ttl: 3600, // 1 hour
  });

  token.addGrant(voiceGrant);
  token.addGrant(videoGrant);

  return token.toJwt();
};

// Create a Twilio Video Room
// utils/twilio.ts
export const createRoom = async (roomName: string) => {
  try {
    const room = await client.video.rooms.create({
      uniqueName: roomName,
      type: 'group', // ✅ Use 'group' instead of 'go'
      // type: 'peer-to-peer', // Alternative for peer-to-peer (max 2 participants)
      recordParticipantsOnConnect: false, // Optional
      statusCallback: `${process.env.YOUR_DOMAIN}/api/v1/twilio/call-status`, // Optional
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
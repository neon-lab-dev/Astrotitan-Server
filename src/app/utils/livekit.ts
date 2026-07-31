/* eslint-disable @typescript-eslint/no-explicit-any */
import { AccessToken, VideoGrant } from 'livekit-server-sdk';
import config from '../config';

// Generate LiveKit Access Token
export const generateLiveKitToken = (
  identity: string,
  roomName: string,
  metadata?: Record<string, any>
): string => {
  const apiKey = config.livekit_api_key;
  const apiSecret = config.livekit_api_secret;
//   const projectId = config.livekit_project_id;

  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit credentials not configured');
  }

  // Create the access token
  const token:any = new AccessToken(apiKey, apiSecret, {
    identity: identity,
    ttl: '10m', // Token valid for 10 minutes
    metadata: metadata ? JSON.stringify(metadata) : undefined,
  });

  // Add video grant with room permissions
  const videoGrant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  };

  token.addGrant(videoGrant);

  return token.toJwt();
};

// Generate tokens for both participants
export const generateCallTokens = (
  callerId: string,
  receiverId: string,
  roomName: string
): { callerToken: string; receiverToken: string } => {
  const callerToken = generateLiveKitToken(callerId, roomName, {
    role: 'caller',
    userId: callerId,
  });

  const receiverToken = generateLiveKitToken(receiverId, roomName, {
    role: 'receiver',
    userId: receiverId,
  });

  return {
    callerToken,
    receiverToken,
  };
};
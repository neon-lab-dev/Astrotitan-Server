"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCallTokens = exports.generateLiveKitToken = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const livekit_server_sdk_1 = require("livekit-server-sdk");
const config_1 = __importDefault(require("../config"));
// Generate LiveKit Access Token
const generateLiveKitToken = (identity, roomName, metadata) => {
    const apiKey = config_1.default.livekit_api_key;
    const apiSecret = config_1.default.livekit_api_secret;
    //   const projectId = config.livekit_project_id;
    if (!apiKey || !apiSecret) {
        throw new Error('LiveKit credentials not configured');
    }
    // Create the access token
    const token = new livekit_server_sdk_1.AccessToken(apiKey, apiSecret, {
        identity: identity,
        ttl: '10m', // Token valid for 10 minutes
        metadata: metadata ? JSON.stringify(metadata) : undefined,
    });
    // Add video grant with room permissions
    const videoGrant = {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
    };
    token.addGrant(videoGrant);
    return token.toJwt();
};
exports.generateLiveKitToken = generateLiveKitToken;
// Generate tokens for both participants
const generateCallTokens = (callerId, receiverId, roomName) => {
    const callerToken = (0, exports.generateLiveKitToken)(callerId, roomName, {
        role: 'caller',
        userId: callerId,
    });
    const receiverToken = (0, exports.generateLiveKitToken)(receiverId, roomName, {
        role: 'receiver',
        userId: receiverId,
    });
    return {
        callerToken,
        receiverToken,
    };
};
exports.generateCallTokens = generateCallTokens;

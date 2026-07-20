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
exports.getRoomStatus = exports.endRoom = exports.createRoom = exports.generateTwilioAccessToken = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const twilio_1 = __importDefault(require("twilio"));
const config_1 = __importDefault(require("../config"));
const accountSid = config_1.default.twilio_account_sid;
const authToken = config_1.default.twilio_auth_token;
const apiKey = config_1.default.twilio_api_key;
const apiSecret = config_1.default.twilio_api_secret;
const twimlAppSid = config_1.default.twilio_twiml_app_sid;
const client = (0, twilio_1.default)(accountSid, authToken);
// ✅ FIXED: Generate Access Token with correct method
const generateTwilioAccessToken = (identity, roomName) => {
    var _a, _b, _c, _d;
    // ✅ Use the correct AccessToken from twilio.jwt
    const AccessToken = twilio_1.default.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;
    const VoiceGrant = AccessToken.VoiceGrant;
    // ✅ CORRECT way to create token with API Key
    const token = new AccessToken(accountSid, // ✅ Account SID (issuer)
    apiKey, // ✅ API Key SID (SK...)
    apiSecret, // ✅ API Key Secret
    {
        identity: identity,
        ttl: 3600,
    });
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
                identity: (_a = payload.grants) === null || _a === void 0 ? void 0 : _a.identity,
                hasVideoGrant: !!((_b = payload.grants) === null || _b === void 0 ? void 0 : _b.video),
                room: (_d = (_c = payload.grants) === null || _c === void 0 ? void 0 : _c.video) === null || _d === void 0 ? void 0 : _d.room,
            });
        }
    }
    catch (e) {
        console.log('⚠️ Could not decode token');
    }
    return jwtToken;
};
exports.generateTwilioAccessToken = generateTwilioAccessToken;
// Create a Twilio Video Room
const createRoom = (roomName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const room = yield client.video.rooms.create({
            uniqueName: roomName,
            type: 'group',
            recordParticipantsOnConnect: false,
            statusCallback: `${process.env.YOUR_DOMAIN}/api/v1/twilio/call-status`,
        });
        console.log('✅ Room created:', room.sid);
        return room;
    }
    catch (error) {
        console.error('❌ Error creating room:', error);
        throw new Error(error.message || 'Failed to create room');
    }
});
exports.createRoom = createRoom;
// End/Complete a room
const endRoom = (roomName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const room = yield client.video.rooms(roomName).update({ status: 'completed' });
        console.log('✅ Room ended:', room.sid);
        return room;
    }
    catch (error) {
        console.error('❌ Error ending room:', error);
        throw new Error(error.message || 'Failed to end room');
    }
});
exports.endRoom = endRoom;
// Get room status
const getRoomStatus = (roomName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const room = yield client.video.rooms(roomName).fetch();
        return room;
    }
    catch (error) {
        console.error('❌ Error fetching room:', error);
        return null;
    }
});
exports.getRoomStatus = getRoomStatus;

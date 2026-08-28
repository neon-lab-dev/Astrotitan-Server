"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class ZoomVideoService {
    constructor() {
        this.sdkKey = process.env.ZOOM_VIDEO_SDK_KEY;
        this.sdkSecret = process.env.ZOOM_VIDEO_SDK_SECRET;
    }
    validateCredentials() {
        if (!this.sdkKey || !this.sdkSecret) {
            throw new Error("Zoom Video SDK credentials are not configured");
        }
    }
    generateSessionName(consultationId) {
        return `astro_${consultationId}`;
    }
    generateSessionPassword() {
        return Math.random()
            .toString(36)
            .substring(2, 12);
    }
    generateToken({ sessionName, userKey, roleType, }) {
        this.validateCredentials();
        const sdkSecret = this.sdkSecret;
        if (!sdkSecret) {
            throw new Error("Zoom Video SDK credentials are not configured");
        }
        const issuedAt = Math.floor(Date.now() / 1000);
        const expiration = issuedAt + 2 * 60 * 60;
        const payload = {
            app_key: this.sdkKey,
            role_type: roleType,
            tpc: sessionName,
            version: 1,
            iat: issuedAt,
            exp: expiration,
            user_key: userKey,
        };
        return jsonwebtoken_1.default.sign(payload, sdkSecret, {
            algorithm: "HS256",
        });
    }
}
exports.default = new ZoomVideoService();

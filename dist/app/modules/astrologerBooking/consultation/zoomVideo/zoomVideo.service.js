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
    generateToken({ sessionName, roleType, }) {
        this.validateCredentials();
        const sdkSecret = this.sdkSecret;
        const sdkKey = this.sdkKey;
        if (!sdkSecret || !sdkKey) {
            throw new Error("Zoom Video SDK credentials are not configured");
        }
        const iat = Math.floor(Date.now() / 1000) - 30;
        const exp = iat + 60 * 60 * 2;
        const payload = {
            app_key: sdkKey,
            tpc: sessionName,
            role_type: roleType,
            version: 1,
            iat,
            exp,
        };
        return jsonwebtoken_1.default.sign(payload, sdkSecret, {
            algorithm: "HS256",
        });
    }
}
exports.default = new ZoomVideoService();

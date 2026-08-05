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
/* eslint-disable @typescript-eslint/no-explicit-any */
const googleapis_1 = require("googleapis");
const config_1 = __importDefault(require("../../../config"));
const astrologer_model_1 = require("../../astrologer/astrologer.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
class GoogleCalendarService {
    getOAuth2Client() {
        return new googleapis_1.google.auth.OAuth2(config_1.default.google_client_id, config_1.default.google_client_secret, config_1.default.google_redirect_uri);
    }
    /**
     * Generate OAuth URL for astrologer to connect their Google Calendar
     */
    getAuthUrl(astrologerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const oauth2Client = this.getOAuth2Client();
            const scopes = [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/userinfo.email',
            ];
            const authUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: scopes,
                prompt: 'consent',
                state: astrologerId, // Pass astrologer ID to identify them
                // Explicitly set redirect_uri to match Google Console
                redirect_uri: config_1.default.google_redirect_uri,
            });
            return {
                authUrl,
                message: 'Please visit the URL to connect your Google Calendar',
            };
        });
    }
    /**
     * Handle OAuth callback and save credentials for astrologer
     */
    handleOAuthCallback(code, astrologerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                // 1. Find astrologer
                const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId: astrologerId });
                if (!astrologer) {
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
                }
                // 2. Get tokens from Google
                const oauth2Client = this.getOAuth2Client();
                const { tokens } = yield oauth2Client.getToken({
                    code: code,
                    // Explicitly set redirect_uri to match Google Console
                    redirect_uri: config_1.default.google_redirect_uri,
                });
                // 3. Get user info
                oauth2Client.setCredentials(tokens);
                const oauth2 = googleapis_1.google.oauth2({ version: 'v2', auth: oauth2Client });
                const userInfo = yield oauth2.userinfo.get();
                // 4. Update astrologer with credentials
                const updateData = {
                    "googleCalendar.accessToken": tokens.access_token || '',
                    "googleCalendar.tokenExpiry": tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
                    "googleCalendar.email": userInfo.data.email || '',
                    "googleCalendar.calendarId": "primary",
                    "googleCalendar.isConnected": true,
                    "googleCalendar.connectedAt": new Date(), // Add connectedAt timestamp
                };
                // Only update refresh token if provided (happens on first connection)
                if (tokens.refresh_token) {
                    updateData["googleCalendar.refreshToken"] = tokens.refresh_token;
                }
                yield astrologer_model_1.Astrologer.findOneAndUpdate({ accountId: astrologerId }, { $set: updateData }, { new: true });
                return {
                    success: true,
                    message: "Google Calendar connected successfully",
                    data: {
                        email: userInfo.data.email,
                        isConnected: true,
                        connectedAt: new Date(),
                    },
                };
            }
            catch (error) {
                console.error('❌ OAuth callback error:', error);
                // Handle specific OAuth errors
                if (((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) === 'invalid_grant') {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid authorization code. Please try again.');
                }
                if (((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === 'redirect_uri_mismatch') {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Redirect URI mismatch. Please check your Google Cloud Console configuration.');
                }
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, error.message || 'Failed to connect Google Calendar');
            }
        });
    }
    connectWithAccessToken(astrologerId, accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                // 1. Find astrologer
                const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId: astrologerId });
                if (!astrologer) {
                    throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
                }
                // 2. Create OAuth client
                const oauth2Client = this.getOAuth2Client();
                // 3. Set the access token
                oauth2Client.setCredentials({
                    access_token: accessToken,
                });
                // 4. Get user info from Google
                const oauth2 = googleapis_1.google.oauth2({ version: 'v2', auth: oauth2Client });
                const userInfo = yield oauth2.userinfo.get();
                // 5. Check if refresh token is available
                const refreshToken = oauth2Client.credentials.refresh_token;
                // 6. Update astrologer with credentials
                const updateData = {
                    "googleCalendar.accessToken": accessToken,
                    "googleCalendar.email": userInfo.data.email || '',
                    "googleCalendar.calendarId": "primary",
                    "googleCalendar.isConnected": true,
                    "googleCalendar.connectedAt": new Date(),
                };
                // Store refresh token if available
                if (refreshToken) {
                    updateData["googleCalendar.refreshToken"] = refreshToken;
                }
                yield astrologer_model_1.Astrologer.findOneAndUpdate({ accountId: astrologerId }, { $set: updateData }, { new: true });
                return {
                    success: true,
                    message: "Google Calendar connected successfully",
                    data: {
                        email: userInfo.data.email,
                        isConnected: true,
                        connectedAt: new Date(),
                    },
                };
            }
            catch (error) {
                console.error('❌ Connect with access token error:', error);
                if (((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) === 'invalid_grant') {
                    throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid access token. Please try again.');
                }
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, error.message || 'Failed to connect Google Calendar');
            }
        });
    }
    /**
     * Get astrologer's calendar connection status
     */
    getConnectionStatus(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId: accountId });
            if (!astrologer) {
                throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
            }
            return {
                isConnected: ((_a = astrologer.googleCalendar) === null || _a === void 0 ? void 0 : _a.isConnected) || false,
                email: ((_b = astrologer.googleCalendar) === null || _b === void 0 ? void 0 : _b.email) || null,
                connectedAt: ((_c = astrologer.googleCalendar) === null || _c === void 0 ? void 0 : _c.connectedAt) || null,
                calendarId: ((_d = astrologer.googleCalendar) === null || _d === void 0 ? void 0 : _d.calendarId) || "primary",
            };
        });
    }
    /**
     * Disconnect Google Calendar for astrologer
     */
    disconnectCalendar(astrologerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId: astrologerId });
            if (!astrologer) {
                throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
            }
            // Clear Google Calendar data
            astrologer.googleCalendar = {
                accessToken: undefined,
                refreshToken: undefined,
                tokenExpiry: undefined,
                email: undefined,
                calendarId: "primary",
                isConnected: false,
                connectedAt: undefined,
            };
            yield astrologer.save();
            return {
                success: true,
                message: "Google Calendar disconnected successfully",
            };
        });
    }
    /**
     * Refresh token for astrologer if expired
     */
    // services/googleCalendar.service.ts
    /**
     * Refresh token for astrologer if expired
     */
    refreshTokenIfNeeded(astrologer) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            console.log(astrologer, "test");
            // Now accepts the astrologer object directly
            if (!((_a = astrologer.googleCalendar) === null || _a === void 0 ? void 0 : _a.refreshToken)) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Astrologer hasn't connected Google Calendar");
            }
            // Check if token is expired or will expire in 5 minutes
            const tokenExpiry = astrologer.googleCalendar.tokenExpiry;
            if (tokenExpiry && new Date(tokenExpiry) > new Date(Date.now() + 5 * 60 * 1000)) {
                return; // Token is still valid
            }
            const oauth2Client = this.getOAuth2Client();
            oauth2Client.setCredentials({
                refresh_token: astrologer.googleCalendar.refreshToken,
            });
            try {
                const { credentials } = yield oauth2Client.refreshAccessToken();
                const updateData = {
                    "googleCalendar.accessToken": credentials.access_token || '',
                    "googleCalendar.tokenExpiry": credentials.expiry_date
                        ? new Date(credentials.expiry_date)
                        : undefined,
                };
                yield astrologer_model_1.Astrologer.findByIdAndUpdate(astrologer._id, { $set: updateData });
                // Update the object reference
                astrologer.googleCalendar.accessToken = credentials.access_token;
                astrologer.googleCalendar.tokenExpiry = credentials.expiry_date
                    ? new Date(credentials.expiry_date)
                    : undefined;
                console.log('Token refreshed for astrologer:', astrologer._id);
            }
            catch (error) {
                console.error('❌ Token refresh failed:', error);
                // If refresh fails, mark as disconnected
                yield astrologer_model_1.Astrologer.findByIdAndUpdate(astrologer._id, {
                    $set: {
                        "googleCalendar.isConnected": false,
                    }
                });
                throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Google Calendar token expired. Please reconnect your calendar.');
            }
        });
    }
    /**
     * Create a meeting in astrologer's Google Calendar
     * Now accepts the astrologer object instead of ID
     */
    createMeeting(astrologer, // Pass the already fetched astrologer object
    params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // 1. Check if astrologer has connected Google Calendar
            if (!((_a = astrologer.googleCalendar) === null || _a === void 0 ? void 0 : _a.isConnected)) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Please connect your Google Calendar before scheduling a meeting.");
            }
            // 2. Refresh token if needed (pass the astrologer object)
            yield this.refreshTokenIfNeeded(astrologer);
            // 3. Create OAuth client with astrologer's credentials
            const oauth2Client = this.getOAuth2Client();
            oauth2Client.setCredentials({
                access_token: astrologer.googleCalendar.accessToken,
                refresh_token: astrologer.googleCalendar.refreshToken,
                expiry_date: (_b = astrologer.googleCalendar.tokenExpiry) === null || _b === void 0 ? void 0 : _b.getTime(),
            });
            const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
            // 4. Create event
            const event = {
                summary: params.summary,
                description: params.description,
                start: {
                    dateTime: params.startTime.toISOString(),
                    timeZone: params.timezone || 'UTC',
                },
                end: {
                    dateTime: params.endTime.toISOString(),
                    timeZone: params.timezone || 'UTC',
                },
                attendees: [
                    { email: astrologer.googleCalendar.email },
                    { email: params.attendeeEmail },
                ],
                conferenceData: {
                    createRequest: {
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                        requestId: `meet-${Date.now()}`,
                    },
                },
            };
            try {
                const response = yield calendar.events.insert({
                    calendarId: astrologer.googleCalendar.calendarId || 'primary',
                    requestBody: event,
                    conferenceDataVersion: 1,
                });
                return {
                    eventId: response.data.id,
                    meetLink: response.data.hangoutLink,
                    htmlLink: response.data.htmlLink,
                };
            }
            catch (error) {
                console.error('❌ Failed to create Google Calendar event:', error);
                if (error.code === 401) {
                    throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Google Calendar token expired. Please reconnect your calendar.');
                }
                throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, error.message || 'Failed to create meeting');
            }
        });
    }
}
exports.default = new GoogleCalendarService();

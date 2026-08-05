/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from 'googleapis';
import config from '../../../config';
import { Astrologer } from '../../astrologer/astrologer.model';
import AppError from '../../../errors/AppError';
import httpStatus from 'http-status';

class GoogleCalendarService {
    private getOAuth2Client() {
        return new google.auth.OAuth2(
            config.google_client_id,
            config.google_client_secret,
            config.google_redirect_uri
        );
    }

    /**
     * Generate OAuth URL for astrologer to connect their Google Calendar
     */
    async getAuthUrl(astrologerId: string) {
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
            redirect_uri: config.google_redirect_uri,
        });

        return {
            authUrl,
            message: 'Please visit the URL to connect your Google Calendar',
        };
    }

    /**
     * Handle OAuth callback and save credentials for astrologer
     */
    async handleOAuthCallback(code: string, astrologerId: string) {
        try {
            // 1. Find astrologer
            const astrologer = await Astrologer.findOne({ accountId: astrologerId });
            if (!astrologer) {
                throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
            }

            // 2. Get tokens from Google
            const oauth2Client = this.getOAuth2Client();
            const { tokens } = await oauth2Client.getToken({
                code: code,
                // Explicitly set redirect_uri to match Google Console
                redirect_uri: config.google_redirect_uri,
            });

            // 3. Get user info
            oauth2Client.setCredentials(tokens);
            const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
            const userInfo = await oauth2.userinfo.get();

            // 4. Update astrologer with credentials
            const updateData: any = {
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

            await Astrologer.findOneAndUpdate(
                { accountId: astrologerId },
                { $set: updateData },
                { new: true }
            );

            return {
                success: true,
                message: "Google Calendar connected successfully",
                data: {
                    email: userInfo.data.email,
                    isConnected: true,
                    connectedAt: new Date(),
                },
            };
        } catch (error: any) {
            console.error('❌ OAuth callback error:', error);

            // Handle specific OAuth errors
            if (error.response?.data?.error === 'invalid_grant') {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    'Invalid authorization code. Please try again.'
                );
            }

            if (error.response?.data?.error === 'redirect_uri_mismatch') {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    'Redirect URI mismatch. Please check your Google Cloud Console configuration.'
                );
            }

            throw new AppError(
                httpStatus.INTERNAL_SERVER_ERROR,
                error.message || 'Failed to connect Google Calendar'
            );
        }
    }

    async connectWithAccessToken(astrologerId: string, accessToken: string) {
        try {
            // 1. Find astrologer
            const astrologer = await Astrologer.findOne({ accountId: astrologerId });
            if (!astrologer) {
                throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
            }

            // 2. Create OAuth client
            const oauth2Client = this.getOAuth2Client();
            
            // 3. Set the access token
            oauth2Client.setCredentials({
                access_token: accessToken,
            });

            // 4. Get user info from Google
            const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
            const userInfo = await oauth2.userinfo.get();

            // 5. Check if refresh token is available
            const refreshToken = oauth2Client.credentials.refresh_token;

            // 6. Update astrologer with credentials
            const updateData: any = {
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

            await Astrologer.findOneAndUpdate(
                { accountId: astrologerId },
                { $set: updateData },
                { new: true }
            );

            return {
                success: true,
                message: "Google Calendar connected successfully",
                data: {
                    email: userInfo.data.email,
                    isConnected: true,
                    connectedAt: new Date(),
                },
            };
        } catch (error: any) {
            console.error('❌ Connect with access token error:', error);

            if (error.response?.data?.error === 'invalid_grant') {
                throw new AppError(
                    httpStatus.BAD_REQUEST,
                    'Invalid access token. Please try again.'
                );
            }

            throw new AppError(
                httpStatus.INTERNAL_SERVER_ERROR,
                error.message || 'Failed to connect Google Calendar'
            );
        }
    }

    /**
     * Get astrologer's calendar connection status
     */
    async getConnectionStatus(accountId: string) {
        const astrologer = await Astrologer.findOne({ accountId: accountId });
        if (!astrologer) {
            throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
        }

        return {
            isConnected: astrologer.googleCalendar?.isConnected || false,
            email: astrologer.googleCalendar?.email || null,
            connectedAt: astrologer.googleCalendar?.connectedAt || null,
            calendarId: astrologer.googleCalendar?.calendarId || "primary",
        };
    }

    /**
     * Disconnect Google Calendar for astrologer
     */
    async disconnectCalendar(astrologerId: string) {
        const astrologer = await Astrologer.findOne({ accountId: astrologerId });
        if (!astrologer) {
            throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
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
        await astrologer.save();

        return {
            success: true,
            message: "Google Calendar disconnected successfully",
        };
    }

    /**
     * Refresh token for astrologer if expired
     */
    // services/googleCalendar.service.ts

    /**
     * Refresh token for astrologer if expired
     */
    async refreshTokenIfNeeded(astrologer: any) {
        console.log(astrologer, "test");
        // Now accepts the astrologer object directly
        if (!astrologer.googleCalendar?.refreshToken) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Astrologer hasn't connected Google Calendar"
            );
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
            const { credentials } = await oauth2Client.refreshAccessToken();

            const updateData: any = {
                "googleCalendar.accessToken": credentials.access_token || '',
                "googleCalendar.tokenExpiry": credentials.expiry_date
                    ? new Date(credentials.expiry_date)
                    : undefined,
            };

            await Astrologer.findByIdAndUpdate(
                astrologer._id,
                { $set: updateData }
            );

            // Update the object reference
            astrologer.googleCalendar.accessToken = credentials.access_token;
            astrologer.googleCalendar.tokenExpiry = credentials.expiry_date
                ? new Date(credentials.expiry_date)
                : undefined;

            console.log('Token refreshed for astrologer:', astrologer._id);
        } catch (error: any) {
            console.error('❌ Token refresh failed:', error);

            // If refresh fails, mark as disconnected
            await Astrologer.findByIdAndUpdate(
                astrologer._id,
                {
                    $set: {
                        "googleCalendar.isConnected": false,
                    }
                }
            );

            throw new AppError(
                httpStatus.UNAUTHORIZED,
                'Google Calendar token expired. Please reconnect your calendar.'
            );
        }
    }

    /**
     * Create a meeting in astrologer's Google Calendar
     * Now accepts the astrologer object instead of ID
     */
    async createMeeting(
        astrologer: any, // Pass the already fetched astrologer object
        params: {
            summary: string;
            description: string;
            startTime: Date;
            endTime: Date;
            attendeeEmail: string;
            timezone?: string;
        }
    ) {
        // 1. Check if astrologer has connected Google Calendar
        if (!astrologer.googleCalendar?.isConnected) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Please connect your Google Calendar before scheduling a meeting."
            );
        }

        // 2. Refresh token if needed (pass the astrologer object)
        await this.refreshTokenIfNeeded(astrologer);

        // 3. Create OAuth client with astrologer's credentials
        const oauth2Client = this.getOAuth2Client();
        oauth2Client.setCredentials({
            access_token: astrologer.googleCalendar.accessToken,
            refresh_token: astrologer.googleCalendar.refreshToken,
            expiry_date: astrologer.googleCalendar.tokenExpiry?.getTime(),
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

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
            const response = await calendar.events.insert({
                calendarId: astrologer.googleCalendar.calendarId || 'primary',
                requestBody: event,
                conferenceDataVersion: 1,
            });

            return {
                eventId: response.data.id!,
                meetLink: response.data.hangoutLink!,
                htmlLink: response.data.htmlLink!,
            };
        } catch (error: any) {
            console.error('❌ Failed to create Google Calendar event:', error);

            if (error.code === 401) {
                throw new AppError(
                    httpStatus.UNAUTHORIZED,
                    'Google Calendar token expired. Please reconnect your calendar.'
                );
            }

            throw new AppError(
                httpStatus.INTERNAL_SERVER_ERROR,
                error.message || 'Failed to create meeting'
            );
        }
    }
}

export default new GoogleCalendarService();
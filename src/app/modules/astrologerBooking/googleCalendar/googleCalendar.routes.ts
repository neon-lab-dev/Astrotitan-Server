import express from 'express';
import auth from '../../../middlewares/auth';
import { UserRole } from '../../accounts/accounts.constants';
import { GoogleCalendarController } from './googleCalendar.controller';

const router = express.Router();

// Get OAuth URL to connect Google Calendar
router.get('/auth-url', auth(UserRole.astrologer), GoogleCalendarController.getAuthUrl);

// OAuth callback - exchange code for tokens
router.get('/oauth-callback', GoogleCalendarController.handleCallback);

// Get connection status
router.get('/status', auth(UserRole.astrologer), GoogleCalendarController.getConnectionStatus);

// Disconnect calendar
router.delete('/disconnect', auth(UserRole.astrologer), GoogleCalendarController.disconnectCalendar);

export const GoogleCalendarRoutes = router;
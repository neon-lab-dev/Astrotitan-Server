/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import googleCalendarService from "./googleCalendar.service";

//Get Google Calendar OAuth URL for astrologer to connect
const getAuthUrl = catchAsync(async (req, res) => {
  const astrologerId = req.user._id;

  const result = await googleCalendarService.getAuthUrl(astrologerId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Google Calendar auth URL generated successfully",
    data: result,
  });
});

//Handle Google OAuth callback
const handleCallback = catchAsync(async (req, res) => {
  const { code, state, error } = req.query;

  // Check for errors from Google
  if (error) {
    console.error('❌ Google OAuth error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}`);
  }

  // Validate required params
  // if (!code) {
  //   console.error('❌ Missing authorization code');
  //   return res.redirect(`${process.env.FRONTEND_URL}/astrologer/bookings?error=missing_code`);
  // }

  // if (!state) {
  //   console.error('❌ Missing state parameter (astrologer ID)');
  //   return res.redirect(`${process.env.FRONTEND_URL}/astrologer/bookings?error=missing_state`);
  // }

  // state is the astrologer ID
  const astrologerId = state as string;

  // if (!astrologerId) {
  //   console.error('❌ Invalid astrologer ID in state:', astrologerId);
  //   return res.redirect(`${process.env.FRONTEND_URL}/astrologer/bookings?error=invalid_astrologer`);
  // }

  try {
    const result = await googleCalendarService.handleOAuthCallback(
      code as string,
      astrologerId
    );

    if (result.success) {
      return res.redirect(`${process.env.FRONTEND_URL}`);
    } else {
      return res.redirect(`${process.env.FRONTEND_URL}`);
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    }
  }
});

//Get astrologer's calendar connection status
const getConnectionStatus = catchAsync(async (req, res) => {
  const accountId = req.user._id;

  const result = await googleCalendarService.getConnectionStatus(accountId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Calendar connection status fetched successfully",
    data: result,
  });
});

//Disconnect Google Calendar
const disconnectCalendar = catchAsync(async (req, res) => {
  const astrologerId = req.user._id;

  const result = await googleCalendarService.disconnectCalendar(astrologerId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Google Calendar disconnected successfully",
    data: result,
  });
});

export const GoogleCalendarController = {
  getAuthUrl,
  handleCallback,
  getConnectionStatus,
  disconnectCalendar,
};
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { User } from "../users/user.model";
import AppError from "../../errors/AppError";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import KundliRequest from "./kundliRequest.model";
import { infinitePaginate } from "../../utils/infinitePaginate";
import { Astrologer } from "../astrologer/astrologer.model";
import axios from "axios";


//Get latitude, longitude and timezone from place name using Google Geocoding API
const getLocationDetails = async (place: string) => {
    try {
        // 1. Get lat/lng from Google Geocoding API
        const geocodeResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json`,
            {
                params: {
                    address: place,
                    key: process.env.GOOGLE_MAPS_API_KEY,
                },
            }
        );

        if (geocodeResponse.data.status !== "OK") {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "Unable to find location. Please enter a valid place name."
            );
        }

        const location = geocodeResponse.data.results[0].geometry.location;
        const formattedAddress = geocodeResponse.data.results[0].formatted_address;

        // 2. Get timezone from Google Timezone API
        const timezoneResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/timezone/json`,
            {
                params: {
                    location: `${location.lat},${location.lng}`,
                    timestamp: Math.floor(Date.now() / 1000),
                    key: process.env.GOOGLE_MAPS_API_KEY,
                },
            }
        );

        if (timezoneResponse.data.status !== "OK") {
            // Fallback to IST if timezone API fails
            return {
                latitude: location.lat,
                longitude: location.lng,
                timezone: 5.5,
                formattedAddress,
            };
        }

        // Convert timezone offset from seconds to hours
        const timezoneOffset = timezoneResponse.data.rawOffset / 3600;

        return {
            latitude: location.lat,
            longitude: location.lng,
            timezone: timezoneOffset,
            formattedAddress,
        };
    } catch (error: any) {
        console.error("Geocoding error:", error);
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Failed to fetch location details. Please check the place name and try again."
        );
    }
};

// Send Kundli Request(User)
const sendKundliRequest = async (
    userId: string,
    payload: {
        requestType: "generateKundli" | "analyzeKundli";
        kundliType: string;
        userName: string;
        userEmail: string;
        userPhoneNumber: string;
        dateOfBirth: Date;
        timeOfBirth: string;
        placeOfBirth: string;
        userGender: "male" | "female" | "other";
        userNotes?: string;
    },
    files?: Express.Multer.File[]
) => {
    // 1. Check if user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    // 2. Get latitude, longitude and timezone from placeOfBirth
    const { latitude, longitude, timezone, formattedAddress } =
        await getLocationDetails(payload.placeOfBirth);

    // 3. Upload existing kundli files if any (for analyzeKundli)
    let existingKundliFiles: string[] = [];
    if (files && files.length > 0) {
        const uploads = files.map(async (file, index) => {
            const { secure_url } = await sendImageToCloudinary(
                `kundli-file-${Date.now()}-${index}`,
                file.path
            );
            return secure_url;
        });
        existingKundliFiles = await Promise.all(uploads);
    }

    // 4. Create kundli request
    const kundliRequest = await KundliRequest.create({
        userId,
        requestType: payload.requestType,
        existingKundliFiles,
        userName: payload.userName,
        userEmail: payload.userEmail,
        userPhoneNumber: payload.userPhoneNumber,
        dateOfBirth: payload.dateOfBirth,
        timeOfBirth: payload.timeOfBirth,
        placeOfBirth: formattedAddress || payload.placeOfBirth, // Store formatted address
        latitude,
        longitude,
        timezone,
        userGender: payload.userGender,
        kundliType: payload.kundliType,
        userNotes: payload.userNotes,
        status: "pending",
    });

    return kundliRequest;
};

// Get My Kundli Requests (User)
const getMyKundliRequests = async (
    userId: string,
    filters: { status?: string } = {},
    skip = 0,
    limit = 10
) => {
    const query: any = { userId };

    if (filters.status && filters.status !== "all") {
        query.status = filters.status;
    }

    const result = await infinitePaginate(
        KundliRequest,
        query,
        skip,
        limit,
        [
            {
                path: "userId",
                select: "firstName lastName email profilePicture",
            },
            {
                path: "astrologerId",
                select: "firstName lastName displayName profilePicture",
            },
        ]
    );

    return result;
};

// Get Kundli Requests for Astrologer
const getAstrologerKundliRequests = async (
    astrologerId: string,
    filters: { status?: string } = {},
    skip = 0,
    limit = 10
) => {
    const astrologer = await Astrologer.findById(astrologerId);
    if (!astrologer) {
        throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
    }

    const query: any = { astrologerId };

    if (filters.status && filters.status !== "all") {
        query.status = filters.status;
    }

    const result = await infinitePaginate(
        KundliRequest,
        query,
        skip,
        limit,
        [
            {
                path: "userId",
                select: "firstName lastName email profilePicture",
            },
            {
                path: "astrologerId",
                select: "firstName lastName displayName profilePicture",
            },
        ]
    );

    return result;
};

// Submit Kundli Report (Astrologer)
const submitKundliReport = async (
    astrologerId: string,
    requestId: string,
    file: Express.Multer.File
) => {
    // 1. Check if astrologer exists
    const astrologer = await Astrologer.findById(astrologerId);
    if (!astrologer) {
        throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
    }

    // 2. Find kundli request
    const kundliRequest = await KundliRequest.findOne({
        _id: requestId,
        astrologerId,
    });

    if (!kundliRequest) {
        throw new AppError(httpStatus.NOT_FOUND, "Kundli request not found or not assigned to you");
    }

    // 3. Check if already completed
    if (kundliRequest.status === "completed") {
        throw new AppError(httpStatus.BAD_REQUEST, "Kundli report already submitted");
    }

    // 4. Upload report file
    if (!file) {
        throw new AppError(httpStatus.BAD_REQUEST, "Report file is required");
    }

    const { secure_url } = await sendImageToCloudinary(
        `kundli-report-${Date.now()}`,
        file.path
    );

    // 5. Update kundli request
    kundliRequest.reportUrl = secure_url;
    kundliRequest.status = "completed";
    kundliRequest.completedAt = new Date();
    await kundliRequest.save();

    return kundliRequest;
};

export const KundliRequestServices = {
    sendKundliRequest,
    getMyKundliRequests,
    getAstrologerKundliRequests,
    submitKundliReport,
};
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
const getLocationDetailsFromOSM = async (place: string) => {
    try {
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/search`,
            {
                params: {
                    q: place,
                    format: 'json',
                    limit: 1,
                },
                headers: {
                    'User-Agent': 'YourAppName',
                },
            }
        );

        if (!response.data || response.data.length === 0) {
            throw new Error('Location not found');
        }

        const location = response.data[0];
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);

        const tzResponse = await axios.get(
            `https://timeapi.io/api/timezone/coordinate`,
            {
                params: {
                    latitude: lat,
                    longitude: lng,
                },
            }
        );

        return {
            latitude: lat,
            longitude: lng,
            timezone: tzResponse.data?.currentUtcOffset?.offsetHours || 5.5,
            formattedAddress: location.display_name,
        };
    } catch (error: any) {
        console.error('Geocoding error:', error);
        throw new Error('Failed to fetch location details');
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
    const user = await User.findOne({ accountId: userId });
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    // 2. Get latitude, longitude and timezone from placeOfBirth
    const { latitude, longitude, timezone, formattedAddress } =
        await getLocationDetailsFromOSM(payload.placeOfBirth);

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
        userId: user._id,
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
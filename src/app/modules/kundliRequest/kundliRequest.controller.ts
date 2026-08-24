import httpStatus from "http-status";
import { KundliRequestServices } from "./kundliRequest.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

//Send Kundli Request (User)
const sendKundliRequest = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const files = req.files as Express.Multer.File[];

    const result = await KundliRequestServices.sendKundliRequest(
        userId,
        req.body,
        files
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Kundli request sent successfully",
        data: result,
    });
});

const getAllKundliRequests = catchAsync(async (req, res) => {
    const { skip = "0", limit = "10", requestType, keyword } = req.query;

    const filters = {
        requestType: requestType as string,
        keyword: keyword as string,
    }

    const result = await KundliRequestServices.getAllKundliRequests(
        filters,
        Number(skip),
        Number(limit)
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Kundli requests fetched successfully",
        data: result,
    });
});

//Get My Kundli Requests (User)
const getMyKundliRequests = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { status, skip = "0", limit = "10" } = req.query;

    const result = await KundliRequestServices.getMyKundliRequests(
        userId,
        { status: status as string },
        Number(skip),
        Number(limit)
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Kundli requests fetched successfully",
        data: result,
    });
});

const getSingleKundliRequestById = catchAsync(async (req, res) => {
    const { requestId } = req.params;

    const result = await KundliRequestServices.getSingleKundliRequestById(requestId);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Product fetched successfully",
        data: result,
    });
})

//Get Kundli Requests for Astrologer
const getAstrologerKundliRequests = catchAsync(async (req, res) => {
    const astrologerId = req.user._id;
    const { status, skip = "0", limit = "10" } = req.query;

    const result = await KundliRequestServices.getAstrologerKundliRequests(
        astrologerId,
        { status: status as string },
        Number(skip),
        Number(limit)
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Kundli requests fetched successfully",
        data: result,
    });
});

//Submit Kundli Report (Astrologer)
const submitKundliReport = catchAsync(async (req, res) => {
    const astrologerId = req.user._id;
    const { requestId } = req.params;
    const file = req.file as Express.Multer.File;

    const result = await KundliRequestServices.submitKundliReport(
        astrologerId,
        requestId,
        file
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Kundli report submitted successfully",
        data: result,
    });
});

const assignAstrologer = catchAsync(async (req, res) => {
    const { requestId } = req.params;
    const { astrologerId } = req.body;
    const result = await KundliRequestServices.assignAstrologer(requestId, astrologerId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Astrologer assigned successfully",
        data: result,
    });
})

export const KundliRequestControllers = {
    sendKundliRequest,
    getAllKundliRequests,
    getMyKundliRequests,
    getSingleKundliRequestById,
    getAstrologerKundliRequests,
    submitKundliReport,
    assignAstrologer
};
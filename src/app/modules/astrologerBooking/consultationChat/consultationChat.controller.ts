/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { ConsultationChatServices } from "./consultationChat.service";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";

/* Get Consultation Chat List */
const getConsultationChatList = catchAsync(async (req, res) => {
    const accountId = req.user._id;
    const result = await ConsultationChatServices.getConsultationChatList(accountId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Consultation chat list fetched successfully",
        data: result,
    });
});

/* Get Consultation Messages */
const getConsultationMessages = catchAsync(async (req, res) => {
    const accountId = req.user._id;
    const { consultationId } = req.params;
    const { skip = "0", limit = "50" } = req.query;

    const result = await ConsultationChatServices.getConsultationMessages(
        consultationId,
        accountId,
        Number(skip),
        Number(limit)
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Messages fetched successfully",
        data: result,
    });
});

/* Mark Consultation Messages as Read */
const markConsultationMessagesAsRead = catchAsync(async (req, res) => {
    const accountId = req.user._id;
    const { consultationId } = req.params;

    const result = await ConsultationChatServices.markConsultationMessagesAsRead(
        consultationId,
        accountId
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Messages marked as read",
        data: result,
    });
});

export const ConsultationChatControllers = {
    getConsultationChatList,
    getConsultationMessages,
    markConsultationMessagesAsRead,
};
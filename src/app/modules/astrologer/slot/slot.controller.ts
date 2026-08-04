import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { SlotServices } from "./slot.service";

//Add slots
const addSlots = catchAsync(async (req, res) => {
    const accountId = req.user._id;
    const { date, slots } = req.body;

    const result = await SlotServices.addSlots(accountId, {
        date: new Date(date),
        slots,
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Slots added successfully",
        data: result,
    });
});

//Get all slots
const getAllSlots = catchAsync(async (req, res) => {
    const { astrologerId, date } = req.params;

    const result = await SlotServices.getAllSlots(
        astrologerId,
        new Date(date)
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Slots fetched successfully",
        data: result,
    });
});

export const SlotController = {
    addSlots,
    getAllSlots,
};
import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import Slot from "./slot.model";
import { Astrologer } from "../../astrologer/astrologer.model";

// Add slots for a specific date
const addSlots = async (
    accountId: string,
    payload: {
        date: Date;
        slots: {
            startTime: string;
            endTime: string;
            isBooked?: boolean;
        }[];
    }
) => {
    const astrologer = await Astrologer.findOne({ accountId });
    if (!astrologer) {
        throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
    }

    const existingSlot = await Slot.findOne({
        astrologerId: astrologer._id,
        date: payload.date,
    });

    if (existingSlot) {
        throw new AppError(
            httpStatus.CONFLICT,
            "Slots already exist for this date. Please update existing slots."
        );
    }

    const formattedSlots = payload.slots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: slot.isBooked || false,
    }));

    const newSlot = await Slot.create({
        astrologerId: astrologer._id,
        date: payload.date,
        slots: formattedSlots,
    });

    return newSlot;
};

//Get all slots
const getAllSlots = async (
    astrologerId: string,
    date: Date
) => {
    // 1. Check if astrologer exists
    const astrologer = await Astrologer.findById(astrologerId);
    if (!astrologer) {
        throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
    }

    // 2. Find slots for the date
    const slotDoc = await Slot.findOne({
        astrologerId,
        date: date,
    });

    if (!slotDoc) {
        return {
            astrologerId,
            date,
            slots: [],
            message: "No slots found for this date",
        };
    }

    const slots = Array.isArray(slotDoc.slots) ? slotDoc.slots : [];

    return {
        _id: slotDoc._id,
        astrologerId,
        date,
        slots,
        totalSlots: slots.length,
    };
};

export const SlotServices = {
    addSlots,
    getAllSlots,
};
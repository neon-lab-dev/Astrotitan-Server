/* eslint-disable @typescript-eslint/no-explicit-any */
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

    // Check if slots exist for this date
    const existingSlot = await Slot.findOne({
        astrologerId: astrologer._id,
        date: payload.date,
    });

    // Format new slots with isBooked default
    const formattedSlots = payload.slots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: slot.isBooked || false,
    }));

    if (existingSlot) {
        // UPDATE: Add new slots to existing ones
        // Filter out duplicate slots (based on startTime)
        const existingSlotTimes = new Set(
            (existingSlot.slots as unknown as { startTime: string }[]).map(
                (s) => s.startTime
            )
        );

        const newSlots = formattedSlots.filter(
            (slot) => !existingSlotTimes.has(slot.startTime)
        );

        if (newSlots.length === 0) {
            throw new AppError(
                httpStatus.CONFLICT,
                "These slots already exist for this date."
            );
        }

        // Add new slots to existing ones
        const existingSlots = existingSlot.slots as unknown as {
            startTime: string;
            endTime: string;
            isBooked: boolean;
        }[];
        existingSlot.set("slots", [...existingSlots, ...newSlots]);
        await existingSlot.save();

        return existingSlot;
    } else {
        // CREATE: Create new slot document
        const newSlot = await Slot.create({
            astrologerId: astrologer._id,
            date: payload.date,
            slots: formattedSlots,
        });

        return newSlot;
    }
};

//Get all slots (User)
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

//Get all slots (Astrologer)
const getAllSlotsForAstrologer = async (
    accountId: string,
    date: Date
) => {
    // 1. Check if astrologer exists
    const astrologer = await Astrologer.findOne({ accountId });
    if (!astrologer) {
        throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
    }

    // 2. Find slots for the date
    const slotDoc = await Slot.findOne({
        astrologerId: astrologer._id,
        date: date,
    });

    if (!slotDoc) {
        return {
            astrologerId: astrologer._id,
            date,
            slots: [],
            message: "No slots found for this date",
        };
    }

    const slots = Array.isArray(slotDoc.slots) ? slotDoc.slots : [];

    return {
        _id: slotDoc._id,
        astrologerId: astrologer._id,
        date,
        slots,
        totalSlots: slots.length,
    };
};

export const SlotServices = {
    addSlots,
    getAllSlots,
    getAllSlotsForAstrologer,
};
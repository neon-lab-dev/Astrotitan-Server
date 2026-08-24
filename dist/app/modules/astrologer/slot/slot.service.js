"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlotServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const slot_model_1 = __importDefault(require("./slot.model"));
const astrologer_model_1 = require("../../astrologer/astrologer.model");
// Add slots for a specific date
const addSlots = (accountId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId });
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // Check if slots exist for this date
    const existingSlot = yield slot_model_1.default.findOne({
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
        const existingSlotTimes = new Set(existingSlot.slots.map((s) => s.startTime));
        const newSlots = formattedSlots.filter((slot) => !existingSlotTimes.has(slot.startTime));
        if (newSlots.length === 0) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "These slots already exist for this date.");
        }
        // Add new slots to existing ones
        const existingSlots = existingSlot.slots;
        existingSlot.set("slots", [...existingSlots, ...newSlots]);
        yield existingSlot.save();
        return existingSlot;
    }
    else {
        // CREATE: Create new slot document
        const newSlot = yield slot_model_1.default.create({
            astrologerId: astrologer._id,
            date: payload.date,
            slots: formattedSlots,
        });
        return newSlot;
    }
});
//Get all slots (User)
const getAllSlots = (astrologerId, date) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Check if astrologer exists
    const astrologer = yield astrologer_model_1.Astrologer.findById(astrologerId);
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // 2. Find slots for the date
    const slotDoc = yield slot_model_1.default.findOne({
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
});
//Get all slots (Astrologer)
const getAllSlotsForAstrologer = (accountId, date) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Check if astrologer exists
    const astrologer = yield astrologer_model_1.Astrologer.findOne({ accountId });
    if (!astrologer) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Astrologer not found");
    }
    // 2. Find slots for the date
    const slotDoc = yield slot_model_1.default.findOne({
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
});
exports.SlotServices = {
    addSlots,
    getAllSlots,
    getAllSlotsForAstrologer,
};

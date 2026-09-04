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
exports.runConsultationReminderCron = void 0;
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
const node_cron_1 = __importDefault(require("node-cron"));
const astrologer_model_1 = require("../modules/astrologer/astrologer.model");
const user_model_1 = require("../modules/users/user.model");
const sendSingleNotification_1 = require("../utils/sendSingleNotification");
const consultation_model_1 = __importDefault(require("../modules/astrologerBooking/consultation/consultation.model"));
// Parse time string like "5:00 PM" to Date object
const parseTimeToDate = (timeStr, dateStr) => {
    // Extract date part
    const date = new Date(dateStr);
    // Parse time like "5:00 PM" or "5:30 PM"
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) {
        hours += 12;
    }
    if (modifier === 'AM' && hours === 12) {
        hours = 0;
    }
    date.setHours(hours, minutes, 0, 0);
    return date;
};
// Send reminder for a single consultation
const sendConsultationReminder = (consultation) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        // Get user details
        const user = yield user_model_1.User.findById(consultation.user);
        const astrologer = yield astrologer_model_1.Astrologer.findById(consultation.astrologer);
        if (!user || !astrologer) {
            console.log('❌ User or Astrologer not found');
            return;
        }
        // Get booked slot details
        const slot = (_b = (_a = consultation.slotId) === null || _a === void 0 ? void 0 : _a.slots) === null || _b === void 0 ? void 0 : _b.find((s) => { var _a; return s._id.toString() === ((_a = consultation.bookedSlotId) === null || _a === void 0 ? void 0 : _a.toString()); });
        if (!slot) {
            console.log('❌ Booked slot not found');
            return;
        }
        const startTime = slot.startTime; // e.g., "5:00 PM"
        const date = (_c = consultation.slotId) === null || _c === void 0 ? void 0 : _c.date; // e.g., "2026-08-31T00:00:00.000Z"
        if (!date) {
            console.log('❌ Date not found');
            return;
        }
        const scheduledDate = parseTimeToDate(startTime, date);
        // Format date for display
        const formattedDate = scheduledDate.toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'Asia/Kolkata',
        });
        // Format time for display
        const formattedTime = scheduledDate.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata',
        });
        // Send notification to USER
        yield (0, sendSingleNotification_1.sendSingleNotification)(user === null || user === void 0 ? void 0 : user.accountId, '🔔 Consultation Reminder', `Your consultation with ${astrologer.displayName || astrologer.firstName} is scheduled for ${formattedDate} at ${formattedTime}. Please be ready.`);
        // Send notification to ASTROLOGER
        yield (0, sendSingleNotification_1.sendSingleNotification)(astrologer.accountId, '🔔 Upcoming Consultation Reminder', `You have a consultation with ${user.firstName} ${user.lastName} scheduled for ${formattedDate} at ${formattedTime}. Please be ready.`);
    }
    catch (error) {
        console.error(`❌ Failed to send reminder for consultation ${consultation._id}:`, error);
    }
});
// Main cron job - runs every minute to check for upcoming consultations
const runConsultationReminderCron = () => {
    node_cron_1.default.schedule('* * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        console.log('🔄 Running consultation reminder check...');
        try {
            // Get current time in IST
            const now = new Date();
            // Get all consultations with 'call' method and 'accepted' status
            const consultations = yield consultation_model_1.default.find({
                method: 'call',
                status: { $in: ['accepted', 'pending'] },
                'slotId.slots.isBooked': true,
            })
                .populate('slotId')
                .populate('user', 'name email phoneNumber')
                .populate('astrologer', 'displayName firstName lastName accountId')
                .lean();
            // Filter consultations that need reminders
            for (const consultation of consultations) {
                try {
                    // Find the booked slot
                    const bookedSlot = (_b = (_a = consultation.slotId) === null || _a === void 0 ? void 0 : _a.slots) === null || _b === void 0 ? void 0 : _b.find((s) => { var _a; return s._id.toString() === ((_a = consultation.bookedSlotId) === null || _a === void 0 ? void 0 : _a.toString()); });
                    if (!bookedSlot)
                        continue;
                    const startTime = bookedSlot.startTime;
                    const date = (_c = consultation.slotId) === null || _c === void 0 ? void 0 : _c.date;
                    if (!date || !startTime)
                        continue;
                    const scheduledDate = parseTimeToDate(startTime, date);
                    // Check if the consultation is scheduled within the next 30 minutes
                    const timeDiff = scheduledDate.getTime() - now.getTime();
                    const isWithin30Minutes = timeDiff > 0 && timeDiff <= 30 * 60 * 1000;
                    if (isWithin30Minutes) {
                        yield sendConsultationReminder(consultation);
                    }
                }
                catch (error) {
                    console.error(`Error processing consultation ${consultation._id}:`, error);
                }
            }
        }
        catch (error) {
            console.error('❌ Consultation reminder cron failed:', error);
        }
    }), {
        timezone: 'Asia/Kolkata', // India timezone
    });
};
exports.runConsultationReminderCron = runConsultationReminderCron;

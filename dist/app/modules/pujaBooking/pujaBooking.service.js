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
exports.PujaBookingServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const pujaBooking_model_1 = require("./pujaBooking.model");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const infinitePaginate_1 = require("../../utils/infinitePaginate");
const puja_model_1 = __importDefault(require("../puja/puja.model"));
const sendSingleNotification_1 = require("../../utils/sendSingleNotification");
const user_model_1 = require("../users/user.model");
/* User: Book a Puja */
const bookPuja = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if puja exists
    const puja = yield puja_model_1.default.findById(payload.pujaId);
    if (!puja) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Puja not found");
    }
    const user = yield user_model_1.User.findOne({ accountId: userId });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    // Create booking
    const booking = yield pujaBooking_model_1.PujaBooking.create({
        userId: user === null || user === void 0 ? void 0 : user._id,
        name: payload.name,
        phoneNumber: payload.phoneNumber,
        pujaId: payload.pujaId,
        preferredDate: payload.preferredDate,
        purposeOfPuja: payload.purposeOfPuja,
        status: "pending",
    });
    // Send notification to user
    yield (0, sendSingleNotification_1.sendSingleNotification)(userId, "Puja Booking Request Received 🙏", `We have received your booking request for "${puja.name}" on ${new Date(payload.preferredDate).toLocaleDateString()}. Our team will contact you shortly to confirm the booking.`);
    // Populate puja details for response
    const bookingWithPuja = yield pujaBooking_model_1.PujaBooking.findById(booking._id).populate("pujaId", "name category price");
    return bookingWithPuja;
});
/* User: Get My Bookings */
const getMyBookings = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, filters = {}, skip = 0, limit = 10) {
    const user = yield user_model_1.User.findOne({ accountId: userId });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const query = { userId: user._id };
    // Status filter
    if (filters.status && filters.status !== "all") {
        query.status = filters.status;
    }
    const result = yield (0, infinitePaginate_1.infinitePaginate)(pujaBooking_model_1.PujaBooking, query, skip, limit, ["pujaId"], "name");
    return result;
});
/* User: Get Single Booking */
const getSingleBooking = (bookingId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield pujaBooking_model_1.PujaBooking.findOne({ _id: bookingId, userId });
    if (!booking) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Booking not found");
    }
    return booking;
});
/* Admin: Get All Bookings */
const getAllBookings = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
    // Status filter
    if (filters.status) {
        query.status = filters.status;
    }
    // Puja ID filter
    if (filters.pujaId) {
        query.pujaId = filters.pujaId;
    }
    const result = yield (0, infinitePaginate_1.infinitePaginate)(pujaBooking_model_1.PujaBooking, query, skip, limit, ["userId",]);
    return result;
});
/* Admin: Get Single Booking by ID */
const getSingleBookingForAdmin = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield pujaBooking_model_1.PujaBooking.findById(bookingId)
        .populate("userId");
    if (!booking) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Booking not found");
    }
    return booking;
});
/* Admin: Update Booking Status with Admin Notes */
const updateBookingStatus = (bookingId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield pujaBooking_model_1.PujaBooking.findById(bookingId);
    if (!booking) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Booking not found");
    }
    const oldStatus = booking.status;
    const newStatus = payload.status;
    // Update booking
    booking.status = payload.status;
    if (payload.adminNotes) {
        booking.adminNotes = payload.adminNotes;
    }
    yield booking.save();
    // Send notification based on status change
    let notificationTitle = "";
    let notificationMessage = "";
    if (oldStatus !== newStatus) {
        switch (newStatus) {
            case "contacted":
                notificationTitle = "Booking Update 📞";
                notificationMessage = `Our team has contacted you regarding your puja booking. ${payload.adminNotes ? `Note: ${payload.adminNotes}` : ""}`;
                break;
            case "booked":
                notificationTitle = "Booking Confirmed ";
                notificationMessage = `Your puja booking has been confirmed! ${payload.adminNotes ? `Note: ${payload.adminNotes}` : ""}`;
                break;
            case "notInterested":
                notificationTitle = "Booking Cancelled ❌";
                notificationMessage = `Your puja booking request has been cancelled. ${payload.adminNotes ? `Reason: ${payload.adminNotes}` : ""}`;
                break;
            default:
                notificationTitle = "Booking Status Updated";
                notificationMessage = `Your puja booking status has been updated to ${newStatus}.`;
        }
        // Send notification to user
        if (notificationTitle) {
            yield (0, sendSingleNotification_1.sendSingleNotification)(booking.userId, notificationTitle, notificationMessage);
        }
    }
    const updatedBooking = yield pujaBooking_model_1.PujaBooking.findById(bookingId);
    return updatedBooking;
});
/* Admin: Delete Puja Booking */
const deleteBooking = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield pujaBooking_model_1.PujaBooking.findById(bookingId);
    if (!booking) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Booking not found");
    }
    yield pujaBooking_model_1.PujaBooking.findByIdAndDelete(bookingId);
    return { message: "Booking deleted successfully" };
});
exports.PujaBookingServices = {
    bookPuja,
    getMyBookings,
    getSingleBooking,
    getAllBookings,
    getSingleBookingForAdmin,
    updateBookingStatus,
    deleteBooking,
};

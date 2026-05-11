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
exports.PujaBookingControllers = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const pujaBooking_service_1 = require("./pujaBooking.service");
/* User: Book a Puja */
const bookPuja = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    console.log(req.user);
    const result = yield pujaBooking_service_1.PujaBookingServices.bookPuja(userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Puja booking request submitted successfully",
        data: result,
    });
}));
/* User: Get My Bookings */
const getMyBookings = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { status, skip = "0", limit = "10" } = req.query;
    const filters = {
        status: status,
    };
    const result = yield pujaBooking_service_1.PujaBookingServices.getMyBookings(userId, filters, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Your bookings fetched successfully",
        data: result,
    });
}));
/* User: Get Single Booking */
const getSingleBooking = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { bookingId } = req.params;
    const result = yield pujaBooking_service_1.PujaBookingServices.getSingleBooking(bookingId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Booking fetched successfully",
        data: result,
    });
}));
/* Admin: Get All Bookings */
const getAllBookings = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, pujaId, skip = "0", limit = "10" } = req.query;
    const filters = {
        status: status,
        pujaId: pujaId,
    };
    const result = yield pujaBooking_service_1.PujaBookingServices.getAllBookings(filters, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "All bookings fetched successfully",
        data: result,
    });
}));
/* Admin: Get Single Booking by ID */
const getSingleBookingForAdmin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bookingId } = req.params;
    const result = yield pujaBooking_service_1.PujaBookingServices.getSingleBookingForAdmin(bookingId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Booking fetched successfully",
        data: result,
    });
}));
/* Admin: Update Booking Status */
const updateBookingStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bookingId } = req.params;
    const result = yield pujaBooking_service_1.PujaBookingServices.updateBookingStatus(bookingId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Booking status updated successfully",
        data: result,
    });
}));
/* Admin: Delete Booking */
const deleteBooking = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bookingId } = req.params;
    const result = yield pujaBooking_service_1.PujaBookingServices.deleteBooking(bookingId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Booking deleted successfully",
        data: result,
    });
}));
exports.PujaBookingControllers = {
    bookPuja,
    getMyBookings,
    getSingleBooking,
    getAllBookings,
    getSingleBookingForAdmin,
    updateBookingStatus,
    deleteBooking,
};

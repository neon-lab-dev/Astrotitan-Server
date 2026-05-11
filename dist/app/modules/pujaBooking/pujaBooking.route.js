"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PujaBookingRoutes = void 0;
const express_1 = __importDefault(require("express"));
const pujaBooking_controller_1 = require("./pujaBooking.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const accounts_constants_1 = require("../accounts/accounts.constants");
const router = express_1.default.Router();
// User Routes
router.post("/book", (0, auth_1.default)(accounts_constants_1.UserRole.user), pujaBooking_controller_1.PujaBookingControllers.bookPuja);
router.get("/my-bookings", (0, auth_1.default)(accounts_constants_1.UserRole.user), pujaBooking_controller_1.PujaBookingControllers.getMyBookings);
router.get("/my-bookings/:bookingId", (0, auth_1.default)(accounts_constants_1.UserRole.user), pujaBooking_controller_1.PujaBookingControllers.getSingleBooking);
// Admin Routes
router.get("/", (0, auth_1.default)(accounts_constants_1.UserRole.admin), pujaBooking_controller_1.PujaBookingControllers.getAllBookings);
router.get("/:bookingId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), pujaBooking_controller_1.PujaBookingControllers.getSingleBookingForAdmin);
router.patch("/update-status/:bookingId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), pujaBooking_controller_1.PujaBookingControllers.updateBookingStatus);
router.delete("/delete/:bookingId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), pujaBooking_controller_1.PujaBookingControllers.deleteBooking);
exports.PujaBookingRoutes = router;

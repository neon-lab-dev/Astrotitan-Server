import express from "express";
import { PujaBookingControllers } from "./pujaBooking.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../accounts/accounts.constants";

const router = express.Router();

// User Routes
router.post(
  "/book",
  auth(UserRole.user),
  PujaBookingControllers.bookPuja
);

router.get(
  "/my-bookings",
  auth(UserRole.user),
  PujaBookingControllers.getMyBookings
);

router.get(
  "/my-bookings/:bookingId",
  auth(UserRole.user),
  PujaBookingControllers.getSingleBooking
);

// Admin Routes
router.get(
  "/",
  auth(UserRole.admin),
  PujaBookingControllers.getAllBookings
);

router.get(
  "/:bookingId",
  auth(UserRole.admin),
  PujaBookingControllers.getSingleBookingForAdmin
);

router.patch(
  "/update-status/:bookingId",
  auth(UserRole.admin),
  PujaBookingControllers.updateBookingStatus
);

router.delete(
  "/delete/:bookingId",
  auth(UserRole.admin),
  PujaBookingControllers.deleteBooking
);

export const PujaBookingRoutes = router;
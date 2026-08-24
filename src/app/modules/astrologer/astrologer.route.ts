import express from "express";
import { AstrologerControllers } from "./astrologer.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../accounts/accounts.constants";

const router = express.Router();

// Admin routes
router.get(
  "/",
  auth(UserRole.admin, UserRole.user, UserRole.astrologer),
  AstrologerControllers.getAllAstrologer
);

// For astrologer
router.get(
  "/stats/my",
  auth(UserRole.astrologer),
  AstrologerControllers.getStats
);

router.get(
  "/pending-identity",
  auth(UserRole.admin),
  AstrologerControllers.getPendingIdentityRequests
);

router.get(
  "/:astrologerId",
  auth(UserRole.admin, UserRole.user, UserRole.astrologer),
  AstrologerControllers.getSingleAstrologerById
);

router.patch(
  "/update-identity-status/:astrologerId",
  auth(UserRole.admin),
  AstrologerControllers.updateIdentityStatus
);

router.put(
  "/availability/update",
  auth(UserRole.astrologer),
  AstrologerControllers.updateAvailability
);


export const AstrologerRoutes = router;
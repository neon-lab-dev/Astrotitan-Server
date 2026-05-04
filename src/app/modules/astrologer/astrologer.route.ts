import express from "express";
import { AstrologerControllers } from "./astrologer.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../accounts/accounts.constants";

const router = express.Router();

// Admin routes
router.get(
  "/",
  AstrologerControllers.getAllAstrologer
);

router.get(
  "/pending-identity",
  auth(UserRole.admin),
  AstrologerControllers.getPendingIdentityRequests
);

router.get(
  "/:astrologerId",
  AstrologerControllers.getSingleAstrologerById
);

router.patch(
  "/update-identity-status/:astrologerId",
  auth(UserRole.admin),
  AstrologerControllers.updateIdentityStatus
);

// Review Routes (Protected - User only)
router.post(
  "/review/add/:astrologerId",
  auth(UserRole.user),
  AstrologerControllers.addReview
);

router.patch(
  "/review/update/:astrologerId",
  auth(UserRole.user),
  AstrologerControllers.updateReview
);

router.delete(
  "/review/delete/:astrologerId",
  auth(UserRole.user, UserRole.admin),
  AstrologerControllers.deleteReview
);
export const AstrologerRoutes = router;
import express from "express";
import { AstrologerControllers } from "./astrologer.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../accounts/accounts.constants";

const router = express.Router();

// Admin routes
router.get(
  "/",
  auth(UserRole.admin),
  AstrologerControllers.getAllAstrologer
);

router.get(
  "/pending-identity",
  auth(UserRole.admin),
  AstrologerControllers.getPendingIdentityRequests
);

router.get(
  "/:astrologerId",
  auth(UserRole.admin),
  AstrologerControllers.getSingleAstrologerById
);

router.patch(
  "/update-identity-status/:astrologerId",
  auth(UserRole.admin),
  AstrologerControllers.updateIdentityStatus
);

export const AstrologerRoutes = router;
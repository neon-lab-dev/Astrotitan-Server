import express from "express";
import { QueryControllers } from "./query.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../accounts/accounts.constants";
import multer from "multer";

const multerUpload = multer({ dest: "uploads/" });

const router = express.Router();

// User Routes
router.post(
  "/raise",
  auth(UserRole.user, UserRole.astrologer),
  multerUpload.array("attachments"),
  QueryControllers.raiseQuery
);

router.get(
  "/my-queries",
  auth(UserRole.user, UserRole.astrologer),
  QueryControllers.getMyQueries
);

router.get(
  "/my-queries/:queryId",
  auth(UserRole.user, UserRole.astrologer),
  QueryControllers.getSingleQuery
);

router.patch(
  "/my-queries/:queryId/attachments",
  auth(UserRole.user, UserRole.astrologer),
  multerUpload.array("attachments"),
  QueryControllers.addAttachment
);

router.delete(
  "/my-queries/delete/:queryId",
  auth(UserRole.user, UserRole.astrologer),
  QueryControllers.deleteMyQuery
);

// Admin Routes
router.get(
  "/",
  auth(UserRole.admin),
  QueryControllers.getAllQueries
);

router.get(
  "/:queryId",
  auth(UserRole.admin),
  QueryControllers.getSingleQueryForAdmin
);

router.patch(
  "/update-status/:queryId",
  auth(UserRole.admin),
  QueryControllers.updateQueryStatus
);

router.delete(
  "/delete/:queryId",
  auth(UserRole.admin),
  QueryControllers.deleteQuery
);

export const QueryRoutes = router;
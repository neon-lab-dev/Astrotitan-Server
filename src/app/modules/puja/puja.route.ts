import express from "express";
import { PujaControllers } from "./puja.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../accounts/accounts.constants";
import multer from "multer";

const multerUpload = multer({ dest: "uploads/" });

const router = express.Router();

router.post(
  "/add",
  auth(UserRole.admin),
  multerUpload.array("files", 10),
  PujaControllers.addPuja
);

router.get(
  "/",
  PujaControllers.getAllPujas
);

router.get(
  "/:pujaId",
  PujaControllers.getSinglePujaById
);

router.patch(
  "/update/:pujaId",
  auth(UserRole.admin),
  multerUpload.array("files", 10),
  PujaControllers.updatePuja
);

router.delete(
  "/delete/:pujaId",
  auth(UserRole.admin),
  PujaControllers.deletePuja
);

// Review Routes
router.post(
  "/add-review/:pujaId",
  auth(UserRole.user, UserRole.astrologer),
  multerUpload.array("files", 5),
  PujaControllers.addReview
);

router.patch(
  "/update-review/:pujaId/:reviewId",
  auth(UserRole.user, UserRole.astrologer),
  multerUpload.array("files", 5),
  PujaControllers.updateReview
);

router.delete(
  "/delete-review/:pujaId/:reviewId",
  auth(UserRole.user, UserRole.astrologer),
  PujaControllers.deleteReview
);

export const PujaRoutes = router;
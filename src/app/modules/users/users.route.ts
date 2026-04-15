import express from "express";
import { UserControllers } from "./users.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../accounts/accounts.constants";

const router = express.Router();

router.get(
  "/",
  auth(UserRole.admin),
  UserControllers.getAllUser
);
// router.get(
//   "/me",
//   auth(
//     UserRole.user,
//     UserRole.admin,
//     UserRole.astrologer
//   ),
//   UserControllers.getMe
// );

router.patch(
  "/suspend/:userId",
  auth(UserRole.admin),
  UserControllers.suspendUser
);
router.patch(
  "/active/:userId",
  auth(UserRole.admin),
  UserControllers.activeUser
);
router.get(
  "/:userId",
  auth(UserRole.admin),
  UserControllers.getSingleUserById
);

// router.patch(
//   "/update-profile",
//   auth(
//     UserRole.user,
//     UserRole.admin,
//     UserRole.staff,
//     UserRole.tutor,
//     UserRole.guardian
//   ),
//   multerUpload.single("file"),
//   UserControllers.updateProfile
// );

router.patch(
  "/delete-account",
  auth(UserRole.user, UserRole.astrologer),
  UserControllers.deleteAccount
);

// For admin and staff only
router.patch(
  "/account/restore/:userId",
  auth(UserRole.admin),
  UserControllers.restoreDeletedAccount
);

export const userRoutes = router;

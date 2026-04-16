import express from "express";
import { AuthControllers } from "./accounts.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "./accounts.constants";
import { multerUpload } from "../../config/multer.config";

const router = express.Router();

router.post(
  "/signup",
  AuthControllers.signup
);

router.post(
  "/verify-signup-otp",
  AuthControllers.verifySignupOtp
);

router.post(
  "/resend-signup-otp",
  AuthControllers.resendSignupOtp
);

router.put(
  "/complete-profile",
  auth(UserRole.user, UserRole.astrologer),
  multerUpload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "identityFront", maxCount: 1 },
    { name: "identityBack", maxCount: 1 },
  ]),
  AuthControllers.completeProfile
);


// Login Routes (OTP based login)
router.post(
  "/login",
  AuthControllers.login
);

router.post(
  "/verify-login-otp",
  AuthControllers.verifyLoginOtp
);

router.post(
  "/resend-login-otp",
  AuthControllers.resendLoginOtp
);

// Token Routes
router.post(
  "/refresh-token",
  AuthControllers.refreshToken
);

// Admin Routes
router.put(
  "/change-role",
  auth(UserRole.admin),
  AuthControllers.changeUserRole
);


router.patch(
  "/suspend/:accountId",
  auth(UserRole.admin),
  AuthControllers.suspendAccount
);
router.patch(
  "/active/:accountId",
  auth(UserRole.admin),
  AuthControllers.activeAccount
);

export const AccountsRoutes = router;
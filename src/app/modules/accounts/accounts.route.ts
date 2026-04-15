import express from "express";
import { AuthControllers } from "./accounts.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "./accounts.constants";

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

router.post(
  "/logout",
  auth(),
  AuthControllers.logout
);

// Admin Routes
router.put(
  "/change-role",
  auth(UserRole.admin),
  AuthControllers.changeUserRole
);

export const AccountsRoutes = router;
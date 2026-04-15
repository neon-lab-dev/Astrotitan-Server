import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { AuthValidations } from "./auth.validation";
import { AuthControllers } from "./auth.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "./auth.constants";
// import { upload } from "../../utils/sendImageToCloudinary";
const router = express.Router();

router.post("/add-staff", auth(UserRole.admin), AuthControllers.addStaff);
router.post("/signup", AuthControllers.signup);
router.post("/verify-otp", AuthControllers.verifyOtp);
router.post("/resend-otp", AuthControllers.resendOtp);

router.post(
  "/login",
  validateRequest(AuthValidations.LoginValidationSchema),
  AuthControllers.loginUser
);
router.post(
  "/refresh-token",
  validateRequest(AuthValidations.refreshTokenValidationSchema),
  AuthControllers.refreshToken
);

router.post("/forgot-password", AuthControllers.forgetPassword);
router.post("/verify-reset-password-otp", AuthControllers.verifyResetOtp);
router.post("/resend-forgot-password-otp", AuthControllers.resendForgotPasswordOtp);

router.post(
  "/reset-password",
  validateRequest(AuthValidations.resetPasswordValidationSchema),
  AuthControllers.resetPassword
);

router.post(
  "/change-password",
  auth(UserRole.admin, UserRole.user, UserRole.tutor, UserRole.guardian, UserRole.staff),
  AuthControllers.changePassword
);

router.put(
  "/change-role",
  auth(UserRole.admin),
  AuthControllers.changeUserRole
);

export const AuthRoute = router;

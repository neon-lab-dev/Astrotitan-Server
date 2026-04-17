"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const accounts_controller_1 = require("./accounts.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const accounts_constants_1 = require("./accounts.constants");
const multer_config_1 = require("../../config/multer.config");
const router = express_1.default.Router();
router.post("/signup", accounts_controller_1.AuthControllers.signup);
router.post("/verify-signup-otp", accounts_controller_1.AuthControllers.verifySignupOtp);
router.post("/resend-signup-otp", accounts_controller_1.AuthControllers.resendSignupOtp);
router.put("/complete-profile", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), multer_config_1.multerUpload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "identityFront", maxCount: 1 },
    { name: "identityBack", maxCount: 1 },
]), accounts_controller_1.AuthControllers.completeProfile);
// Login Routes (OTP based login)
router.post("/login", accounts_controller_1.AuthControllers.login);
router.post("/verify-login-otp", accounts_controller_1.AuthControllers.verifyLoginOtp);
router.post("/resend-login-otp", accounts_controller_1.AuthControllers.resendLoginOtp);
router.post("/admin/login", accounts_controller_1.AuthControllers.loginAdmin);
// Token Routes
router.post("/refresh-token", accounts_controller_1.AuthControllers.refreshToken);
// Admin Routes
router.put("/change-role", (0, auth_1.default)(accounts_constants_1.UserRole.admin), accounts_controller_1.AuthControllers.changeUserRole);
router.patch("/suspend/:accountId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), accounts_controller_1.AuthControllers.suspendAccount);
router.patch("/active/:accountId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), accounts_controller_1.AuthControllers.activeAccount);
exports.AccountsRoutes = router;

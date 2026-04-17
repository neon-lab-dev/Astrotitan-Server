"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = __importDefault(require("express"));
const users_controller_1 = require("./users.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const accounts_constants_1 = require("../accounts/accounts.constants");
const router = express_1.default.Router();
router.get("/", (0, auth_1.default)(accounts_constants_1.UserRole.admin), users_controller_1.UserControllers.getAllUser);
// router.get(
//   "/me",
//   auth(
//     UserRole.user,
//     UserRole.admin,
//     UserRole.astrologer
//   ),
//   UserControllers.getMe
// );
router.get("/:userId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), users_controller_1.UserControllers.getSingleUserById);
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
router.patch("/delete-account", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), users_controller_1.UserControllers.deleteAccount);
// For admin and staff only
router.patch("/account/restore/:userId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), users_controller_1.UserControllers.restoreDeletedAccount);
exports.userRoutes = router;

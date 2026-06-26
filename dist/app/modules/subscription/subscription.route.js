"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const subscription_controller_1 = require("./subscription.controller");
const accounts_constants_1 = require("../accounts/accounts.constants");
const router = express_1.default.Router();
router.post("/create-order", (0, auth_1.default)(accounts_constants_1.UserRole.user), subscription_controller_1.BoardRoomBanterSubscriptionController.createRazorpayOrder);
router.post("/create", (0, auth_1.default)(accounts_constants_1.UserRole.user), subscription_controller_1.BoardRoomBanterSubscriptionController.createSubscription);
router.post("/verify-payment", subscription_controller_1.BoardRoomBanterSubscriptionController.verifySubscription);
// router.post(
//   "/pause",
//   auth(UserRole.user),
//   BoardRoomBanterSubscriptionController.pauseSubscription
// );
// router.post(
//   "/resume",
//   auth(UserRole.user),
//   BoardRoomBanterSubscriptionController.resumeSubscription
// );
router.post("/cancel", (0, auth_1.default)(accounts_constants_1.UserRole.user), subscription_controller_1.BoardRoomBanterSubscriptionController.cancelSubscription);
router.get("/", (0, auth_1.default)(accounts_constants_1.UserRole.admin), subscription_controller_1.BoardRoomBanterSubscriptionController.getAllSubscriptions);
router.get("/my-subscription", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.admin), subscription_controller_1.BoardRoomBanterSubscriptionController.getMySubscription);
router.get("/:id", (0, auth_1.default)(accounts_constants_1.UserRole.admin), subscription_controller_1.BoardRoomBanterSubscriptionController.getSingleSubscriptionById);
exports.SubscriptionRoutes = router;

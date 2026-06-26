import express from "express";
import auth from "../../middlewares/auth";
import { BoardRoomBanterSubscriptionController } from "./subscription.controller";
import { UserRole } from "../accounts/accounts.constants";

const router = express.Router();

router.post(
  "/create-order",
  auth(UserRole.user),
  BoardRoomBanterSubscriptionController.createRazorpayOrder
);

router.post(
  "/create",
  auth(UserRole.user),
  BoardRoomBanterSubscriptionController.createSubscription
);

router.post(
  "/verify-payment",
  BoardRoomBanterSubscriptionController.verifySubscription
);

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

router.post(
  "/cancel",
  auth(UserRole.user),
  BoardRoomBanterSubscriptionController.cancelSubscription
);

router.get(
  "/",
  auth(UserRole.admin),
  BoardRoomBanterSubscriptionController.getAllSubscriptions
);

router.get(
  "/my-subscription",
  auth(UserRole.user, UserRole.admin),
  BoardRoomBanterSubscriptionController.getMySubscription
);

router.get(
  "/:id",
  auth(UserRole.admin),
  BoardRoomBanterSubscriptionController.getSingleSubscriptionById
);

export const SubscriptionRoutes = router;

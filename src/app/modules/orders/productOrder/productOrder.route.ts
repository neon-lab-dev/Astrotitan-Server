import { Router } from "express";
import auth from "../../../middlewares/auth";
import { ProductOrderControllers } from "./productOrder.controller";
import { UserRole } from "../../accounts/accounts.constants";

const router = Router();

router.post(
    "/checkout",
    auth(UserRole.admin, UserRole.user),
    ProductOrderControllers.checkout
);
router.post(
    "/create",
    auth(UserRole.admin, UserRole.user),
    ProductOrderControllers.createProductOrder
);

router.post(
    "/verify-payment",
    ProductOrderControllers.verifyPayment
);

router.get(
    "/status/:orderId",
    auth(UserRole.admin, UserRole.user),
    ProductOrderControllers.checkPaymentStatus
);

router.get("/my-orders", auth(UserRole.admin, UserRole.user), ProductOrderControllers.getMyProductOrders);

// For admin/moderator only
router.get("/", auth(UserRole.admin), ProductOrderControllers.getAllProductOrders);
router.get("/:orderId", auth(UserRole.admin), ProductOrderControllers.getSingleProductOrderById);
router.get("/user/:userId", auth(UserRole.admin), ProductOrderControllers.getProductOrdersByUserId);
router.put("/update-status/:orderId", auth(UserRole.admin), ProductOrderControllers.updateDeliveryStatus);

export const ProductOrderRoutes = router;
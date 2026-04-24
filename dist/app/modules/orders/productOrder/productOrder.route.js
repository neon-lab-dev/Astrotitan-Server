"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductOrderRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const productOrder_controller_1 = require("./productOrder.controller");
const accounts_constants_1 = require("../../accounts/accounts.constants");
const router = (0, express_1.Router)();
router.post("/checkout", (0, auth_1.default)(accounts_constants_1.UserRole.admin, accounts_constants_1.UserRole.user), productOrder_controller_1.ProductOrderControllers.checkout);
router.post("/verify-payment", productOrder_controller_1.ProductOrderControllers.verifyPayment);
router.post("/create", (0, auth_1.default)(accounts_constants_1.UserRole.admin, accounts_constants_1.UserRole.user), productOrder_controller_1.ProductOrderControllers.createProductOrder);
router.get("/my-orders", (0, auth_1.default)(accounts_constants_1.UserRole.admin, accounts_constants_1.UserRole.user), productOrder_controller_1.ProductOrderControllers.getMyProductOrders);
// For admin/moderator only
router.get("/", (0, auth_1.default)(accounts_constants_1.UserRole.admin), productOrder_controller_1.ProductOrderControllers.getAllProductOrders);
router.get("/:orderId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), productOrder_controller_1.ProductOrderControllers.getSingleProductOrderById);
router.get("/user/:userId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), productOrder_controller_1.ProductOrderControllers.getProductOrdersByUserId);
router.put("/update-status/:orderId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), productOrder_controller_1.ProductOrderControllers.updateDeliveryStatus);
exports.ProductOrderRoutes = router;

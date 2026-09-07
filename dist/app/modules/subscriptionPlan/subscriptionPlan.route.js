"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionPlanRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const subscriptionPlan_controller_1 = require("./subscriptionPlan.controller");
const accounts_constants_1 = require("../accounts/accounts.constants");
const router = express_1.default.Router();
router.post("/create", (0, auth_1.default)(accounts_constants_1.UserRole.admin), subscriptionPlan_controller_1.SubscriptionPlanController.createPlan);
router.get("/all", (0, auth_1.default)(accounts_constants_1.UserRole.admin), subscriptionPlan_controller_1.SubscriptionPlanController.getAllPlans);
router.get("/", (0, auth_1.default)(accounts_constants_1.UserRole.user), subscriptionPlan_controller_1.SubscriptionPlanController.getAllPlansForUser);
router.get("/:id", (0, auth_1.default)(accounts_constants_1.UserRole.admin, accounts_constants_1.UserRole.user), subscriptionPlan_controller_1.SubscriptionPlanController.getPlanById);
router.put("/update/:id", (0, auth_1.default)(accounts_constants_1.UserRole.admin), subscriptionPlan_controller_1.SubscriptionPlanController.updatePlan);
router.delete("/delete/:id", (0, auth_1.default)(accounts_constants_1.UserRole.admin), subscriptionPlan_controller_1.SubscriptionPlanController.deletePlan);
router.patch("/toggle-status/:id", (0, auth_1.default)(accounts_constants_1.UserRole.admin), subscriptionPlan_controller_1.SubscriptionPlanController.togglePlanStatus);
exports.SubscriptionPlanRoutes = router;

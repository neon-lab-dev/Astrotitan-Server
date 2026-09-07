import express from "express";
import auth from "../../middlewares/auth";
import { SubscriptionPlanController } from "./subscriptionPlan.controller";
import { UserRole } from "../accounts/accounts.constants";

const router = express.Router();

router.post("/create", auth(UserRole.admin), SubscriptionPlanController.createPlan);
router.get("/all", auth(UserRole.admin), SubscriptionPlanController.getAllPlans);
router.get("/", auth(UserRole.user), SubscriptionPlanController.getAllPlansForUser);
router.get("/:id", auth(UserRole.admin, UserRole.user), SubscriptionPlanController.getPlanById);
router.put("/update/:id", auth(UserRole.admin), SubscriptionPlanController.updatePlan);
router.delete("/delete/:id", auth(UserRole.admin), SubscriptionPlanController.deletePlan);
router.patch("/toggle-status/:id", auth(UserRole.admin), SubscriptionPlanController.togglePlanStatus);

export const SubscriptionPlanRoutes = router;
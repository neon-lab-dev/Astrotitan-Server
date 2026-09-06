import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "../accounts/accounts.constants";
import { AdminControllers } from "./admin.controller";

const router = express.Router();

// Admin routes
router.get(
    "/stats",
    auth(UserRole.admin),
    AdminControllers.getAdminStats
);


export const AdminRoutes = router;
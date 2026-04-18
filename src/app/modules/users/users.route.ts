import express from "express";
import { UserControllers } from "./users.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../accounts/accounts.constants";

const router = express.Router();

router.get(
  "/",
  auth(UserRole.admin),
  UserControllers.getAllUser
);

router.get(
  "/:userId",
  auth(UserRole.admin),
  UserControllers.getSingleUserById
);

export const userRoutes = router;

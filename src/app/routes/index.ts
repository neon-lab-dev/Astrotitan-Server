import { Router } from "express";
import { AccountsRoutes } from "../modules/accounts/accounts.route";
import { userRoutes } from "../modules/users/users.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AccountsRoutes,
  },
  {
    path: "/user",
    route: userRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

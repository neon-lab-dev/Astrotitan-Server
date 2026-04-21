import { Router } from "express";
import { AccountsRoutes } from "../modules/accounts/accounts.route";
import { userRoutes } from "../modules/users/users.route";
import { AstrologerRoutes } from "../modules/astrologer/astrologer.route";
import { ProductRoutes } from "../modules/product/product.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/account",
    route: AccountsRoutes,
  },
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/astrologer",
    route: AstrologerRoutes,
  },
  {
    path: "/product",
    route: ProductRoutes,
  }

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

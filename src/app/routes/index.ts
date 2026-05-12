import { Router } from "express";
import { AccountsRoutes } from "../modules/accounts/accounts.route";
import { userRoutes } from "../modules/users/users.route";
import { AstrologerRoutes } from "../modules/astrologer/astrologer.route";
import { ProductRoutes } from "../modules/product/product.route";
import { PujaRoutes } from "../modules/puja/puja.route";
import { CategoryRoutes } from "../modules/categories/categories.route";
import { ProductOrderRoutes } from "../modules/orders/productOrder/productOrder.route";
import { AddressRoutes } from "../modules/orders/address/address.route";
import { QueryRoutes } from "../modules/query/query.route";
import { PujaBookingRoutes } from "../modules/pujaBooking/pujaBooking.route";
import { BlogRoutes } from "../modules/blog/blog.route";

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
    path: "/address",
    route: AddressRoutes,
  },
  {
    path: "/product",
    route: ProductRoutes,
  },
  {
    path: "/product-order",
    route: ProductOrderRoutes
  },
  {
    path: "/puja",
    route: PujaRoutes,
  },
  {
    path: "/category",
    route: CategoryRoutes,
  },
  {
    path: "/query",
    route: QueryRoutes,
  },
  {
    path: "/puja-booking",
    route: PujaBookingRoutes,
  },
  {
    path: "/blog",
    route: BlogRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

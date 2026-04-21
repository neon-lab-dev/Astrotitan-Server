"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const accounts_route_1 = require("../modules/accounts/accounts.route");
const users_route_1 = require("../modules/users/users.route");
const astrologer_route_1 = require("../modules/astrologer/astrologer.route");
const product_route_1 = require("../modules/product/product.route");
const puja_route_1 = require("../modules/puja/puja.route");
const categories_route_1 = require("../modules/categories/categories.route");
const router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/account",
        route: accounts_route_1.AccountsRoutes,
    },
    {
        path: "/user",
        route: users_route_1.userRoutes,
    },
    {
        path: "/astrologer",
        route: astrologer_route_1.AstrologerRoutes,
    },
    {
        path: "/product",
        route: product_route_1.ProductRoutes,
    },
    {
        path: "/puja",
        route: puja_route_1.PujaRoutes,
    },
    {
        path: "/category",
        route: categories_route_1.CategoryRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;

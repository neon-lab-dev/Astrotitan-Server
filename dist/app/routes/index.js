"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const accounts_route_1 = require("../modules/accounts/accounts.route");
const users_route_1 = require("../modules/users/users.route");
const astrologer_route_1 = require("../modules/astrologer/astrologer.route");
const product_route_1 = require("../modules/product/product.route");
const puja_route_1 = require("../modules/puja/puja.route");
const categories_route_1 = require("../modules/categories/categories.route");
const productOrder_route_1 = require("../modules/orders/productOrder/productOrder.route");
const address_route_1 = require("../modules/orders/address/address.route");
const query_route_1 = require("../modules/query/query.route");
const pujaBooking_route_1 = require("../modules/pujaBooking/pujaBooking.route");
const blog_route_1 = require("../modules/blog/blog.route");
const consultation_route_1 = require("../modules/astrologerBooking/consultation/consultation.route");
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
        path: "/address",
        route: address_route_1.AddressRoutes,
    },
    {
        path: "/product",
        route: product_route_1.ProductRoutes,
    },
    {
        path: "/product-order",
        route: productOrder_route_1.ProductOrderRoutes
    },
    {
        path: "/puja",
        route: puja_route_1.PujaRoutes,
    },
    {
        path: "/category",
        route: categories_route_1.CategoryRoutes,
    },
    {
        path: "/query",
        route: query_route_1.QueryRoutes,
    },
    {
        path: "/puja-booking",
        route: pujaBooking_route_1.PujaBookingRoutes,
    },
    {
        path: "/blog",
        route: blog_route_1.BlogRoutes,
    },
    {
        path: "/consultation",
        route: consultation_route_1.ConsultationRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;

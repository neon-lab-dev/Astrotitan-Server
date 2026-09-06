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
const consultationChat_route_1 = require("../modules/astrologerBooking/consultationChat/consultationChat.route");
const subscription_route_1 = require("../modules/subscription/subscription.route");
const notification_route_1 = require("../modules/notification/notification.route");
const googleCalendar_routes_1 = require("../modules/astrologerBooking/googleCalendar/googleCalendar.routes");
const slot_routes_1 = require("../modules/astrologer/slot/slot.routes");
const kundliRequest_routes_1 = require("../modules/kundliRequest/kundliRequest.routes");
const admin_route_1 = require("../modules/admin/admin.route");
const router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/admin",
        route: admin_route_1.AdminRoutes,
    },
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
        path: "/slot",
        route: slot_routes_1.SlotRoutes,
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
    {
        path: "/consultation-chat",
        route: consultationChat_route_1.ConsultationChatRoutes,
    },
    {
        path: "/subscription",
        route: subscription_route_1.SubscriptionRoutes,
    },
    {
        path: "/notification",
        route: notification_route_1.NotificationRoutes,
    },
    {
        path: "/google-calendar",
        route: googleCalendar_routes_1.GoogleCalendarRoutes,
    },
    {
        path: "/kundli-request",
        route: kundliRequest_routes_1.KundliRequestRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;

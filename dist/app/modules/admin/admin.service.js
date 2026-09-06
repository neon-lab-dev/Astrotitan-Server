"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminServices = void 0;
const astrologer_model_1 = require("../astrologer/astrologer.model");
const consultation_model_1 = __importDefault(require("../astrologerBooking/consultation/consultation.model"));
const kundliRequest_model_1 = __importDefault(require("../kundliRequest/kundliRequest.model"));
const productOrder_model_1 = require("../orders/productOrder/productOrder.model");
const product_model_1 = __importDefault(require("../product/product.model"));
const puja_model_1 = __importDefault(require("../puja/puja.model"));
const pujaBooking_model_1 = require("../pujaBooking/pujaBooking.model");
const user_model_1 = require("../users/user.model");
const getAdminStats = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Execute all queries in parallel for better performance
        const [totalUsers, totalAstrologers, totalProducts, pendingOrders, listedPoojas, pendingPoojaBookings, totalConsultations, pendingKundliRequests, 
        // Additional stats for charts
        monthlyUserRegistrations, monthlyConsultations, monthlyPoojaBookings, monthlyKundliRequests, monthlyOrders,] = yield Promise.all([
            // Total Users
            user_model_1.User.countDocuments(),
            // Total Astrologers
            astrologer_model_1.Astrologer.countDocuments(),
            // Total Products
            product_model_1.default.countDocuments(),
            // Pending Orders (status: pending)
            productOrder_model_1.ProductOrder.countDocuments({ status: "pending" }),
            // Listed Poojas (active poojas)
            puja_model_1.default.countDocuments(),
            // Pending Pooja Bookings
            pujaBooking_model_1.PujaBooking.countDocuments({ status: "pending" }),
            // Total Consultations
            consultation_model_1.default.countDocuments(),
            // Pending Kundli Requests
            kundliRequest_model_1.default.countDocuments({ status: "pending" }),
            // Monthly User Registrations (last 6 months)
            getMonthlyStats(user_model_1.User, "createdAt", 6),
            // Monthly Consultations (last 6 months)
            getMonthlyStats(consultation_model_1.default, "createdAt", 6),
            // Monthly Pooja Bookings (last 6 months)
            getMonthlyStats(pujaBooking_model_1.PujaBooking, "createdAt", 6),
            // Monthly Kundli Requests (last 6 months)
            getMonthlyStats(kundliRequest_model_1.default, "createdAt", 6),
            // Monthly Orders (last 6 months)
            getMonthlyStats(productOrder_model_1.ProductOrder, "createdAt", 6),
        ]);
        return {
            success: true,
            data: {
                // KPI Cards
                overview: {
                    totalUsers,
                    totalAstrologers,
                    totalProducts,
                    totalConsultations,
                    listedPoojas,
                },
                // Pending Items
                pending: {
                    orders: pendingOrders,
                    poojaBookings: pendingPoojaBookings,
                    kundliRequests: pendingKundliRequests,
                },
                // Chart Data
                charts: {
                    userRegistrations: monthlyUserRegistrations,
                    consultations: monthlyConsultations,
                    poojaBookings: monthlyPoojaBookings,
                    kundliRequests: monthlyKundliRequests,
                    orders: monthlyOrders,
                },
            },
        };
    }
    catch (error) {
        console.error("Error fetching admin stats:", error);
        return {
            success: false,
            message: "Failed to fetch admin statistics",
            error: error instanceof Error ? error.message : String(error),
        };
    }
});
// Helper: Get monthly statistics for last N months
const getMonthlyStats = (model, dateField, months) => __awaiter(void 0, void 0, void 0, function* () {
    const result = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const count = yield model.countDocuments({
            [dateField]: {
                $gte: date,
                $lt: nextDate,
            },
        });
        result.push({
            month: date.toLocaleString("default", { month: "short" }),
            year: date.getFullYear(),
            count,
        });
    }
    return result;
});
exports.AdminServices = {
    getAdminStats,
};

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Astrologer } from "../astrologer/astrologer.model";
import Consultation from "../astrologerBooking/consultation/consultation.model";
import KundliRequest from "../kundliRequest/kundliRequest.model";
import { ProductOrder } from "../orders/productOrder/productOrder.model";
import Product from "../product/product.model";
import Puja from "../puja/puja.model";
import { PujaBooking } from "../pujaBooking/pujaBooking.model";
import { User } from "../users/user.model";

const getAdminStats = async () => {
  try {
    // Execute all queries in parallel for better performance
    const [
      totalUsers,
      totalAstrologers,
      totalProducts,
      pendingOrders,
      listedPoojas,
      pendingPoojaBookings,
      totalConsultations,
      pendingKundliRequests,
      // Additional stats for charts
      monthlyUserRegistrations,
      monthlyConsultations,
      monthlyPoojaBookings,
      monthlyKundliRequests,
      monthlyOrders,
    ] = await Promise.all([
      // Total Users
      User.countDocuments(),
      
      // Total Astrologers
      Astrologer.countDocuments(),
      
      // Total Products
      Product.countDocuments(),
      
      // Pending Orders (status: pending)
      ProductOrder.countDocuments({ status: "pending" }),
      
      // Listed Poojas (active poojas)
      Puja.countDocuments(),
      
      // Pending Pooja Bookings
      PujaBooking.countDocuments({ status: "pending" }),
      
      // Total Consultations
      Consultation.countDocuments(),
      
      // Pending Kundli Requests
      KundliRequest.countDocuments({ status: "pending" }),
      
      // Monthly User Registrations (last 6 months)
      getMonthlyStats(User, "createdAt", 6),
      
      // Monthly Consultations (last 6 months)
      getMonthlyStats(Consultation, "createdAt", 6),
      
      // Monthly Pooja Bookings (last 6 months)
      getMonthlyStats(PujaBooking, "createdAt", 6),
      
      // Monthly Kundli Requests (last 6 months)
      getMonthlyStats(KundliRequest, "createdAt", 6),
      
      // Monthly Orders (last 6 months)
      getMonthlyStats(ProductOrder, "createdAt", 6),
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
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return {
      success: false,
      message: "Failed to fetch admin statistics",
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

// Helper: Get monthly statistics for last N months
const getMonthlyStats = async (
  model: any,
  dateField: string,
  months: number
) => {
  const result = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    
    const count = await model.countDocuments({
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
};

export const AdminServices = {
  getAdminStats,
};
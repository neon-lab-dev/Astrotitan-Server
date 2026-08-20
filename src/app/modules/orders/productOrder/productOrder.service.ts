/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../../errors/AppError";
import httpStatus from "http-status";
import { TProductOrder } from "./productOrder.interface";
import { ProductOrder } from "./productOrder.model";
import { razorpay } from "../../../utils/razorpay";
import Product from "../../product/product.model";
import { infinitePaginate } from "../../../utils/infinitePaginate";
import config from "../../../config";
import crypto from "crypto";

const checkout = async (amount: number) => {
  if (!amount || amount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid payment amount");
  }

  const razorpayOrder = await razorpay.orders.create({
    amount: amount * 100, // in paisa
    currency: "INR",
  });

  return {
    razorpayOrder,
    key_id: config.razorpay_api_key,
  };
};

// Verify payment (works for both web and app)
const verifyPayment = async (payload: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  orderId?: string; // For web
}) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = payload;

  // Generate signature for verification
  const generatedSignature = crypto
    .createHmac("sha256", config.razorpay_api_secret!)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  // Compare signatures
  if (generatedSignature !== razorpaySignature) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment verification failed: Invalid signature");
  }

  // Find order by razorpayOrderId or orderId
  let order;
  if (orderId) {
    order = await ProductOrder.findById(orderId);
  } else {
    order = await ProductOrder.findOne({ razorpayOrderId });
  }

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  // Update order status
  order.paymentStatus = "paid";
  order.status = "confirmed";
  order.razorpayPaymentId = razorpayPaymentId;
  order.paymentDate = new Date();
  await order.save();

  // Update product quantities (deduct stock)
  for (const item of order.orderedItems) {
    const product = await Product.findById(item.productId);
    if (product) {
      product.quantity -= item.quantity;
      await product.save();
    }
  }

  // Return redirect URL for web (if needed)
  const redirectUrl = `${process.env.PAYMENT_REDIRECT_URL}-success?type=product&orderId=${order._id}`;

  return {
    success: true,
    message: "Payment verified successfully",
    order,
    redirectUrl,
  };
};

// Create Product Order (with Razorpay order for app)
const createProductOrder = async (user: any, payload: TProductOrder) => {
  // Validate products and stock
  const productIds = payload.orderedItems.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  if (products.length !== payload.orderedItems.length) {
    throw new AppError(httpStatus.NOT_FOUND, "Some products not found");
  }

  // Get product details and validate stock
  const orderedItems = await Promise.all(
    payload.orderedItems.map(async (item) => {
      const product = products.find(
        (p) => p._id.toString() === item.productId.toString()
      );

      if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, `Product ${item.productId} not found`);
      }

      if (product.quantity < item.quantity) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Not enough stock for product ${product.name}. Available: ${product.quantity}`
        );
      }

      return {
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.discountedPrice,
      };
    })
  );

  // Create order ID
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const orderId = `AT-${randomNum}`;

  // Create Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: payload.totalAmount * 100, // Convert to paisa
    currency: "INR",
    receipt: orderId,
    notes: {
      orderId: orderId,
      userId: user._id.toString(),
    },
  });

  // Create order in database
  const order = await ProductOrder.create({
    orderId,
    userId: user._id,
    orderedItems,
    totalAmount: payload.totalAmount,
    addressId: payload.addressId,
    status: "pending",
    paymentStatus: "pending",
    razorpayOrderId: razorpayOrder.id,
  });

  // Return both: Razorpay order (for app) and redirect URL (for web)
  return {
    order,
    razorpayOrder: {
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: config.razorpay_api_key,
    },
    paymentUrl: `${process.env.PAYMENT_REDIRECT_URL}?type=product&orderId=${order._id}&razorpayOrderId=${razorpayOrder.id}`,
  };
};

// Check payment status
const checkPaymentStatus = async (orderId: string) => {
  const order = await ProductOrder.findById(orderId);
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  return {
    orderId: order._id,
    orderNumber: order.orderId,
    paymentStatus: order.paymentStatus,
    status: order.status,
    totalAmount: order.totalAmount,
  };
};

// Get all orders
const getAllProductOrders = async (
  filters: {
    keyword?: string;
    status?: string;
  } = {},
  skip = 0,
  limit = 10
) => {
  const query: any = {};

  // Status filter
  if (filters.status && filters.status !== "all") {
    query.status = { $regex: `^${filters.status}$`, $options: "i" };
  }

  // Keyword search (orderId)
  if (filters.keyword) {
    query.orderId = { $regex: filters.keyword, $options: "i" };
  }

  // Get paginated results with populate
  const result = await infinitePaginate(
    ProductOrder,
    query,
    skip,
    limit,
    ["userId"]
  );

  return result;
};

// Get single order by ID
const getSingleProductOrderById = async (orderId: string) => {
  const result = await ProductOrder.findById(orderId)
    .populate(
      "userId",
    )
    .populate("orderedItems.productId", "name imageUrls category");

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  return result;
};

// Get all orders for a particular user
const getProductOrdersByUserId = async (userId: string) => {
  const result = await ProductOrder.find({ userId });
  if (!result || result.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "No orders found for this user");
  }
  return result;
};

// Get my orders
const getMyProductOrders = async (
  userId: string,
  keyword?: string,
  status?: string,
  page = 1,
  limit = 10
) => {
  const query: any = { userId };

  if (keyword) {
    query.$or = [{ orderId: { $regex: keyword, $options: "i" } }];
  }

  if (status && status !== "all") {
    query.status = { $regex: status, $options: "i" };
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    ProductOrder.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate(
        "userId",
      )
      .populate("orderedItems.productId", "imageUrls"),
    ProductOrder.countDocuments(query),
  ]);

  return {
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    data: orders,
  };
};

// Get my orders (user)
const updateDeliveryStatus = async (orderId: string, payload: {

  status: string;
}) => {
  const result = await ProductOrder.findByIdAndUpdate(
    orderId,
    { status: payload.status },
    { new: true }
  );
  return result;
};

export const ProductOrderService = {
  checkout,
  verifyPayment,
  createProductOrder,
  checkPaymentStatus,
  getAllProductOrders,
  getSingleProductOrderById,
  getProductOrdersByUserId,
  getMyProductOrders,
  updateDeliveryStatus,
};

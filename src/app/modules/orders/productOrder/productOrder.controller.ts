import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { ProductOrderService } from "./productOrder.service";

const checkout = catchAsync(async (req, res) => {
  const { amount } = req.body;
  const razorpayOrder = await ProductOrderService.checkout(amount);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment initiated successfully",
    data: razorpayOrder,
  });
});

// Verify payment
const verifyPayment = catchAsync(async (req, res) => {
  const { razorpay_payment_id } = req.body;

  const redirectUrl =
    await ProductOrderService.verifyPayment(razorpay_payment_id);

  return res.redirect(redirectUrl);
});

// Create order (customer)
const createProductOrder = catchAsync(async (req, res) => {
  const result = await ProductOrderService.createProductOrder(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order created successfully",
    data: result,
  });
});

// Get all orders (Admin/Moderator)
const getAllProductOrders = catchAsync(async (req, res) => {
  const { keyword, status, page = "1", limit = "10" } = req.query;

  const result = await ProductOrderService.getAllProductOrders(
    keyword as string,
    status as string,
    Number(page),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All Orders fetched successfully",
    data: {
      productOrders: result.data,
      pagination: result.meta,
    },
  });
});

// Get single order by ID
const getSingleProductOrderById = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const result = await ProductOrderService.getSingleProductOrderById(orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order fetched successfully",
    data: result,
  });
});

// Get all orders for a particular user
const getProductOrdersByUserId = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result =
    await ProductOrderService.getProductOrdersByUserId(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Orders fetched successfully",
    data: result,
  });
});

// Get logged-in user's orders (user)
const getMyProductOrders = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { keyword, status, page = "1", limit = "10" } = req.query;

  const result = await ProductOrderService.getMyProductOrders(
    userId,
    keyword as string,
    status as string,
    Number(page),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My orders fetched successfully",
    data: {
      orders: result.data,
      pagination: result.meta,
    },
  });
});


// Update delivery status (Admin/Moderator)
const updateDeliveryStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const result = await ProductOrderService.updateDeliveryStatus(orderId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Status changed successfully",
    data: result,
  });
});

export const ProductOrderControllers = {
  checkout,
  verifyPayment,
  createProductOrder,
  getAllProductOrders,
  getSingleProductOrderById,
  getProductOrdersByUserId,
  getMyProductOrders,
  updateDeliveryStatus,
};

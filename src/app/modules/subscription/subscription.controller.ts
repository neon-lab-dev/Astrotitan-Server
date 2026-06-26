import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { SubscriptionServices } from "./subscription.service";




const createRazorpayOrder = catchAsync(async (req, res) => {
  const result = await SubscriptionServices.createRazorpayOrder(
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Order created.",
    data: result,
  });
});

const createSubscription = catchAsync(async (req, res) => {
  const userId = req.user._id
  const result = await SubscriptionServices.createSubscription(
    userId
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Congratulations! Now you are a Premium Member of Astrotitan!",
    data: result,
  });
});

const verifySubscription = catchAsync(async (req, res) => {
  const { razorpay_payment_id } = req.body;

  const redirectUrl =
    await SubscriptionServices.verifySubscription(
      razorpay_payment_id
    );

  return res.redirect(redirectUrl);
});

// Get all subscriptions (Admin/Moderator)
const getAllSubscriptions = catchAsync(async (req, res) => {
  const {
    keyword,
    status,
    isAddedToWhatsappGroup,
    isSuspended,
    isRemoved,
    skip = "0",
    limit = "10",
  } = req.query;

  const filters = {
    keyword: keyword as string,
    status: status as string,
    isAddedToWhatsappGroup: isAddedToWhatsappGroup as string,
    isSuspended: isSuspended as string,
    isRemoved: isRemoved as string,
  };

  const result = await SubscriptionServices.getAllSubscriptions(
    filters,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscriptions fetched successfully",
    data: result,
  });
});

// Get single subscription by ID
const getSingleSubscriptionById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result =
    await SubscriptionServices.getSingleSubscriptionById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription fetched successfully",
    data: result,
  });
});

const cancelSubscription = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result = await SubscriptionServices.cancelSubscription(
    userId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription cancelled!",
    data: result,
  });
});

const getMySubscription = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result =
    await SubscriptionServices.getMySubscription(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Fetched my subscription successfully",
    data: result,
  });
});

export const BoardRoomBanterSubscriptionController = {
  createRazorpayOrder,
  createSubscription,
  verifySubscription,
  getAllSubscriptions,
  getSingleSubscriptionById,
  cancelSubscription,
  getMySubscription,
};

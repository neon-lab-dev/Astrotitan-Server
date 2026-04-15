// users.controller.ts
import { UserServices } from "./users.services";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";

const getAllUser = catchAsync(async (req, res) => {
  const result = await UserServices.getAllUser();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

// Get single post by ID
const getSingleUserById = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await UserServices.getSingleUserById(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User data fetched successfully.",
    data: result,
  });
});

// const getMe = catchAsync(async (req, res) => {
//   const userId = req.user._id;
//   const result = await UserServices.getMe(userId);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Profile retrieved successfully",
//     data: result,
//   });
// });

// suspend user
const suspendUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await UserServices.suspendUser(userId, req.body);
  sendResponse(res, {
    success: true,
    message: "User suspended successfully",
    statusCode: httpStatus.OK,
    data: result,
  });
});

// activate user
const activeUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await UserServices.activeUser(userId);
  sendResponse(res, {
    success: true,
    message: "User activated successfully",
    statusCode: httpStatus.OK,
    data: result,
  });
});
// Delete account
const deleteAccount = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result = await UserServices.deleteAccount(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Account deleted successfully!",
    data: result,
  });
});
// Restore Deleted account
const restoreDeletedAccount = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await UserServices.restoreDeletedAccount(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Account restored successfully!",
    data: result,
  });
});

export const UserControllers = {
  getAllUser,
  // getMe,
  suspendUser,
  activeUser,
  getSingleUserById,
  deleteAccount,
  restoreDeletedAccount,
};

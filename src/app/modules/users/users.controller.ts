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

const getMe = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result = await UserServices.getMe(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: result,
  });
});

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

const requestToUnlockProfile = catchAsync(async (req, res) => {
  const userId  = req.user._id;

  const tutor = await UserServices.requestToUnlockProfile(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile unlocked successfully",
    data: tutor,
  });
});

// Lock/unlock profile
const toggleLockProfile = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await UserServices.toggleLockProfile(userId);
  sendResponse(res, {
    success: true,
    message: "Profile status updated successfully",
    statusCode: httpStatus.OK,
    data: result,
  });
});

// Update tutor profile
const updateProfile = catchAsync(async (req, res) => {
  const file = req.file;
  const userId = req.user._id
  const result = await UserServices.updateProfile(userId, req.body, file);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

// For admin
const giveRating = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { rating } = req.body;

  const result = await UserServices.giveRating(userId, rating);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Rating updated successfully",
    data: result,
  });
});

 const addEducation = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const payload = req.body || {};

  const added = await UserServices.addEducation(userId, payload.educationalInformation);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Education added successfully",
    data: added,
  });
});

 const updateEducation = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const educationId = req.params.educationId;
  const payload = req.body?.educationalInformation ?? req.body;

  const updated = await UserServices.updateEducation(userId, educationId, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Education updated successfully",
    data: updated,
  });
});

/**
 * DELETE /api/profile/education/:educationId
 */
 const deleteEducation = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const educationId = req.params.educationId;

  const updated = await UserServices.deleteEducation(userId, educationId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Education removed successfully",
    data: updated,
  });
});

export const UserControllers = {
  getAllUser,
  getMe,
  suspendUser,
  activeUser,
  getSingleUserById,
  deleteAccount,
  restoreDeletedAccount,
  requestToUnlockProfile,
  toggleLockProfile,
  updateProfile,
  giveRating,
  addEducation,
  updateEducation,
  deleteEducation
};

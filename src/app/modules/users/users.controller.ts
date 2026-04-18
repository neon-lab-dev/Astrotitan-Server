// users.controller.ts
import { UserServices } from "./users.services";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";

const getAllUser = catchAsync(async (req, res) => {
  const {
    keyword,
    gender,
    country,
    skip = "0",
    limit = "10",
  } = req.query;

  const filters = {
    keyword: keyword as string,
    gender: gender as string,
    country: country as string,
  };

  const result = await UserServices.getAllUser(
    filters,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrieved successfully",
    data: {
      users: result.data,
      meta: result.meta,
    },
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

export const UserControllers = {
  getAllUser,
  // getMe,
  getSingleUserById,
};

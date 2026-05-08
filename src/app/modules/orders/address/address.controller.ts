/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { AddressServices } from "./address.service";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";

/* Add Address */
const addAddress = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result = await AddressServices.addAddress(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Address added successfully",
    data: result,
  });
});

/* Get My Addresses */
const getMyAddresses = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const result = await AddressServices.getMyAddresses(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Addresses retrieved successfully",
    data: result,
  });
});

/* Get Single Address */
const getSingleAddress = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { addressId } = req.params;
  const result = await AddressServices.getSingleAddress(addressId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Address retrieved successfully",
    data: result,
  });
});

/* Update Address */
const updateAddress = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { addressId } = req.params;
  console.log(addressId);
  const result = await AddressServices.updateAddress(addressId, userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Address updated successfully",
    data: result,
  });
});

/* Delete Address */
const deleteAddress = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { addressId } = req.params;
  const result = await AddressServices.deleteAddress(addressId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Address deleted successfully",
    data: result,
  });
});

export const AddressControllers = {
  addAddress,
  getMyAddresses,
  getSingleAddress,
  updateAddress,
  deleteAddress,
};
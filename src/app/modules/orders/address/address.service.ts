/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { Address } from "./address.model";
import AppError from "../../../errors/AppError";

/* Add Address */
const addAddress = async (userId: string, payload: any) => {
  
  const address = await Address.create({
    userId,
    ...payload,
  });
  
  return address;
};

/* Get My Addresses */
const getMyAddresses = async (userId: string) => {
  const addresses = await Address.find({ userId })
    .sort({ isDefault: -1, createdAt: -1 });
  
  return addresses;
};

/* Get Single Address */
const getSingleAddress = async (addressId: string, userId: string) => {
  const address = await Address.findOne({ _id: addressId, userId });
  
  if (!address) {
    throw new AppError(httpStatus.NOT_FOUND, "Address not found");
  }
  
  return address;
};

/* Update Address */
const updateAddress = async (
  addressId: string,
  userId: string,
  payload: any
) => {
  // Check if address exists
  const existingAddress = await Address.findOne({ _id: addressId, userId });
  if (!existingAddress) {
    throw new AppError(httpStatus.NOT_FOUND, "Address not found");
  }
  
  // If setting this address as default, remove default from others
  if (payload.isDefault) {
    await Address.updateMany(
      { userId, _id: { $ne: addressId } },
      { isDefault: false }
    );
  }
  
  const address = await Address.findOneAndUpdate(
    { _id: addressId, userId },
    payload,
    { new: true, runValidators: true }
  );
  
  return address;
};

/* Delete Address */
const deleteAddress = async (addressId: string, userId: string) => {
  const address = await Address.findOne({ _id: addressId, userId });
  
  if (!address) {
    throw new AppError(httpStatus.NOT_FOUND, "Address not found");
  }
  
  await Address.findByIdAndDelete(addressId);
  
  
  return { message: "Address deleted successfully" };
};

export const AddressServices = {
  addAddress,
  getMyAddresses,
  getSingleAddress,
  updateAddress,
  deleteAddress,
};
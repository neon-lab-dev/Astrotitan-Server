/* eslint-disable @typescript-eslint/no-explicit-any */
import { Accounts } from "../accounts/accounts.model";

const getAllUser = async () => {
  const result = await Accounts.find();
  return result;
};

const getSingleUserById = async (userId: string) => {
  const result = await Accounts.findById(userId);
  return result;
};


// Suspend user - actual operation on User model
const suspendUser = async (userId: string, payload: any) => {
  const user = await Accounts.findById(userId);
  if (!user) throw new Error("User not found");

  user.isSuspended = true;
  user.suspensionReason = payload.suspensionReason;
  await user.save();

  return user;
};

// Activate user back
const activeUser = async (userId: string) => {
  const user = await Accounts.findById(userId);
  if (!user) throw new Error("User not found");

  user.isSuspended = false;
  user.suspensionReason = null;
  await user.save();

  return user;
};

// Activate user back
const deleteAccount = async (userId: string, payload: any) => {
  const user = await Accounts.findById(userId);
  if (!user) throw new Error("User not found");

  user.isDeleted = true;
  user.accountDeleteReason = payload.accountDeleteReason || null;
  await user.save();

  return user;
};

// Activate user back
const restoreDeletedAccount = async (userId: string) => {
  const user = await Accounts.findByIdAndUpdate(userId, { isDeleted: false });
  if (!user) throw new Error("User not found");

  return user;
};

export const UserServices = {
  getAllUser,
  suspendUser,
  activeUser,
  getSingleUserById,
  deleteAccount,
  restoreDeletedAccount,
};

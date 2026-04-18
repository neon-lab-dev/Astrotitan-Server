/* eslint-disable @typescript-eslint/no-explicit-any */
import { infinitePaginate } from "../../utils/infinitePaginate";
import { Accounts } from "../accounts/accounts.model";
import { User } from "./user.model";

const getAllUser = async (
  filters: {
    keyword?: string;
    gender?: string;
    country?: string;
  } = {},
  skip = 0,
  limit = 10
) => {
  const query: any = {};

  // Search functionality (search on firstName and lastName)
  if (filters.keyword) {
    query.$or = [
      { firstName: { $regex: filters.keyword, $options: "i" } },
      { lastName: { $regex: filters.keyword, $options: "i" } },
    ];
  }

  // Filter by gender
  if (filters.gender) {
    query.gender = filters.gender;
  }

  // Filter by country
  if (filters.country) {
    query.country = { $regex: filters.country, $options: "i" };
  }

  // Get paginated results
  const result = await infinitePaginate(
    User,
    query,
    skip,
    limit,
    []
  );

  // Populate account details for each user
  const usersWithAccount = await Promise.all(
    result.data.map(async (user: any) => {
      const account = await Accounts.findById(user.accountId).select(
        "-otp -loginOtp -resetOtp -password"
      );
      return {
        ...user.toObject(),
        accountDetails: account,
      };
    })
  );

  return {
    data: usersWithAccount,
    meta: result.meta,
  };
};


const getSingleUserById = async (userId: string) => {
  const result = await User.findById(userId).populate("accountId");
  return result;
};

export const UserServices = {
  getAllUser,
  getSingleUserById,
};

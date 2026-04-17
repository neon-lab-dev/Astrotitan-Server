/* eslint-disable @typescript-eslint/no-explicit-any */
import { Accounts } from "../accounts/accounts.model";
import { Astrologer } from "./astrologer.model";
import { infinitePaginate } from "../../utils/infinitePaginate";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const getAllAstrologer = async (
  filters: {
    keyword?: string;
    identityStatus?: string;
    country?: string;
    gender?: string;
    areaOfPractice?: string;
    consultLanguages?: string;
  } = {},
  skip = 0,
  limit = 10
) => {
  const query: any = {};

  // Search functionality (text search on name fields)
  if (filters.keyword) {
    query.$or = [
      { firstName: { $regex: filters.keyword, $options: "i" } },
      { lastName: { $regex: filters.keyword, $options: "i" } },
      { displayName: { $regex: filters.keyword, $options: "i" } },
      { bio: { $regex: filters.keyword, $options: "i" } },
    ];
  }

  // Filter by identity status (pending, approved, rejected)
  if (filters.identityStatus) {
    query["identity.status"] = filters.identityStatus;
  }

  // Filter by country
  if (filters.country) {
    query.country = { $regex: filters.country, $options: "i" };
  }

  // Filter by gender
  if (filters.gender) {
    query.gender = filters.gender;
  }

  // Filter by area of practice
  if (filters.areaOfPractice) {
    query.areaOfPractice = { $in: [filters.areaOfPractice] };
  }

  // Filter by consult languages
  if (filters.consultLanguages) {
    query.consultLanguages = { $in: [filters.consultLanguages] };
  }

  // Get paginated results
  const result = await infinitePaginate(
    Astrologer,
    query,
    skip,
    limit,
    []
  );

  // Populate account details for each astrologer
  const astrologersWithAccount = await Promise.all(
    result.data.map(async (astrologer: any) => {
      const account = await Accounts.findById(astrologer.accountId).select(
        "-otp -loginOtp -resetOtp -password"
      );
      return {
        ...astrologer.toObject(),
        accountDetails: account,
      };
    })
  );

  return {
    data: astrologersWithAccount,
    meta: result.meta,
  };
};

const getSingleAstrologerById = async (astrologerId: string) => {
  const astrologer = await Astrologer.findById(astrologerId);

  if (!astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
  }

  // Get account details
  const account = await Accounts.findById(astrologer.accountId).select(
    "-otp -loginOtp -resetOtp"
  );

  return {
    ...astrologer.toObject(),
    accountDetails: account,
  };
};

const updateIdentityStatus = async (
  astrologerId: string,
  payload: {
    status: "approved" | "rejected";
    rejectedReason?: string;
  }
) => {
  const astrologer = await Astrologer.findById(astrologerId);

  if (!astrologer) {
    throw new AppError(httpStatus.NOT_FOUND, "Astrologer not found");
  }

  // Update identity status
  astrologer.identity.status = payload.status;
  if (payload.status === "rejected" && payload.rejectedReason) {
    astrologer.identity.rejectedReason = payload.rejectedReason;
  }

  // Set identity verified flag
  if (payload.status === "approved") {
    astrologer.isIdentityVerified = true;
    astrologer.identity.rejectedReason = null;
  } else {
    astrologer.isIdentityVerified = false;
  }

  await astrologer.save();

  return {
    success: true,
    message: `Identity ${payload.status === "approved" ? "approved" : "rejected"} successfully`,
    data: {
      astrologerId: astrologer._id,
      identityStatus: astrologer.identity.status,
      isIdentityVerified: astrologer.isIdentityVerified,
    },
  };
};

const getPendingIdentityRequests = async (
  skip = 0,
  limit = 10
) => {
  const query = { "identity.status": "pending" };

  const result = await infinitePaginate(
    Astrologer,
    query,
    skip,
    limit,
    []
  );

  // Populate account details
  const astrologersWithAccount = await Promise.all(
    result.data.map(async (astrologer: any) => {
      const account = await Accounts.findById(astrologer.accountId).select(
        "firstName lastName email phoneNumber profilePicture"
      );
      return {
        ...astrologer.toObject(),
        accountDetails: account,
      };
    })
  );

  return {
    data: astrologersWithAccount,
    meta: result.meta,
  };
};

export const AstrologerServices = {
  getAllAstrologer,
  getSingleAstrologerById,
  updateIdentityStatus,
  getPendingIdentityRequests,
};
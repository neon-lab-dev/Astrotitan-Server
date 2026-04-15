/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from "../auth/auth.model";
import { Tutor } from "../tutor/tutor.model";
import { Guardian } from "../guardian/guardian.model";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { Staff } from "../staff/staff.model";
import mongoose from "mongoose";
import { calculateProfileSections } from "../../utils/calculateTutorProfileSections";

const getAllUser = async () => {
  const result = await User.find();
  return result;
};

const getSingleUserById = async (userId: string) => {
  const result = await User.findById(userId);
  return result;
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  let result;

  if (user.role === "tutor") {
    result = await Tutor.findOne({ userId }).populate(
      "userId",
      "name email phoneNumber gender city area role isVerified hasRequestedToVerify"
    );

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "Tutor profile not found");
    }

    // 🔥 ADD THIS BLOCK
    const profileCompleted = calculateProfileSections(result);
    result = {
      ...result.toObject(),
      profileCompleted,
    };
  } else if (user.role === "guardian") {
    result = await Guardian.findOne({ userId }).populate(
      "userId",
      "name email phoneNumber gender city area role isVerified hasRequestedToVerify hasPostedAnyJob"
    );
  } else if (user.role === "staff") {
    result = await Staff.findOne({ userId }).populate(
      "userId",
      "name email phoneNumber gender city area role"
    );
  } else {
    result = user;
  }

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, `${user.role} profile not found`);
  }

  return result;
};

// Suspend user - actual operation on User model
const suspendUser = async (userId: string, payload: any) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  user.isSuspended = true;
  user.suspensionReason = payload.suspensionReason;
  await user.save();

  return user;
};

// Activate user back
const activeUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  user.isSuspended = false;
  user.suspensionReason = null;
  await user.save();

  return user;
};

// Activate user back
const deleteAccount = async (userId: string, payload: any) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  user.isDeleted = true;
  user.accountDeleteReason = payload.accountDeleteReason || null;
  await user.save();

  return user;
};

// Activate user back
const restoreDeletedAccount = async (userId: string) => {
  const user = await User.findByIdAndUpdate(userId, { isDeleted: false });
  if (!user) throw new Error("User not found");

  return user;
};

const requestToUnlockProfile = async (userId: string, payload: any) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // For Tutor
  if (user.role === "tutor") {
    const updatedTutor = await Tutor.findOneAndUpdate(
      { userId },
      {
        $set: {
          hasAppliedForUnlock: true,
          unlockRequestReason: payload?.unlockRequestReason,
        },
      },
      { new: true }
    );

    if (!updatedTutor) throw new Error("Tutor not found");
    return updatedTutor;
  }

  // For Guardian
  if (user.role === "guardian") {
    const updatedGuardian = await Guardian.findOneAndUpdate(
      { userId },
      {
        $set: {
          hasAppliedForUnlock: true,
          unlockRequestReason: payload?.unlockRequestReason,
        },
      },
      { new: true }
    );

    if (!updatedGuardian) throw new Error("Guardian not found");
    return updatedGuardian;
  }

  // If role is neither tutor nor guardian
  throw new AppError(
    httpStatus.BAD_REQUEST,
    "User role not supported for unlock request"
  );
};

// Lock/unlock profile
const toggleLockProfile = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.role === "tutor") {
    const tutor = await Tutor.findOne({ userId });
    if (!tutor) throw new Error("Tutor not found");

    const isLocked = tutor.profileStatus === "locked";

    const updatedTutor = await Tutor.findOneAndUpdate(
      { userId },
      isLocked
        ? {
            profileStatus: "unlocked",
            hasAppliedForUnlock: false,
            unlockRequestReason: null,
          }
        : { profileStatus: "locked" },
      {
        runValidators: false,
        new: true, // ✅ return updated doc
      }
    );

    return updatedTutor;
  }

  if (user.role === "guardian") {
    const guardian = await Guardian.findOne({ userId });
    if (!guardian) throw new Error("Guardian not found");

    guardian.profileStatus =
      guardian.profileStatus === "locked" ? "unlocked" : "locked";

    if (guardian.profileStatus === "unlocked") {
      guardian.hasAppliedForUnlock = false;
      guardian.unlockRequestReason = null;
    }

    await guardian.save({ validateBeforeSave: false });
    return guardian;
  }

  throw new AppError(
    httpStatus.BAD_REQUEST,
    "User role not supported for lock/unlock"
  );
};

// Update tutor profile
const updateProfile = async (
  userId: string,
  payload: Partial<any>,
  file: any | undefined
) => {
  // ✅ Step 1: Find user and check their role
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Determine which model to update
  const isTutor = user.role === "tutor";
  const isGuardian = user.role === "guardian";

  const existing = isTutor
    ? await Tutor.findOne({ userId })
    : isGuardian
      ? await Guardian.findOne({ userId })
      : null;

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Profile not found");
  }

  // ✅ Step 2: Handle image upload
  let imageUrl: string | undefined;

  if (file) {
    const imageName = `${existing.userId}-${Date.now()}`;
    const path = file.path;

    const { secure_url } = await sendImageToCloudinary(imageName, path);
    imageUrl = secure_url;
  }

  // ✅ Step 3: Split payload for user & role-specific model
  const userUpdatePayload: any = {};
  const roleUpdatePayload: any = {};

  const userFields = ["name", "email", "phoneNumber", "gender", "city", "area"];

  Object.entries(payload).forEach(([key, value]) => {
    if (userFields.includes(key)) {
      userUpdatePayload[key] = value;
    } else {
      roleUpdatePayload[key] = value;
    }
  });

  if (imageUrl) {
    roleUpdatePayload.imageUrl = imageUrl;
  }

  // ✅ Step 4: Update base User info
  if (Object.keys(userUpdatePayload).length > 0) {
    await User.findByIdAndUpdate(existing.userId, userUpdatePayload, {
      new: true,
      runValidators: true,
    });
  }

  // ✅ Step 5: Update either Tutor or Guardian
  const updatedProfile = isTutor
    ? await Tutor.findOneAndUpdate({ userId }, roleUpdatePayload, {
        new: true,
        runValidators: true,
      }).populate("userId")
    : await Guardian.findOneAndUpdate({ userId }, roleUpdatePayload, {
        new: true,
        runValidators: true,
      }).populate("userId");

  if (!updatedProfile) {
    throw new AppError(httpStatus.NOT_FOUND, "Profile update failed");
  }

  await updatedProfile.save();

  // Saving profile pic in user colletion also
  await User.findOneAndUpdate(
    { _id: userId },
    { profilePicture: imageUrl },
    { new: true }
  );

  return updatedProfile;
};

const giveRating = async (userId: string, rating: number) => {
  if (rating > 5)
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Rating should be between 0 to 5 (Excepts decimal values)"
    );
  const guardian = await Guardian.findOne({ userId });
  const tutor = await Tutor.findOne({ userId });

  let result;
  if (guardian) {
    result = await Guardian.findOneAndUpdate({ userId }, { rating });
  } else if (tutor) {
    result = await Tutor.findOneAndUpdate({ userId }, { rating });
  }

  return result;
};

async function getExistingProfile(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const isTutor = user.role === "tutor";
  const isGuardian = user.role === "guardian";

  const existing = isTutor
    ? await Tutor.findOne({ userId: userId })
    : isGuardian
      ? await Guardian.findOne({ userId: userId })
      : null;

  if (!existing) throw new AppError(httpStatus.NOT_FOUND, "Profile not found");

  return { user, existing, isTutor, isGuardian };
}

const addEducation = async (userId: string, educationObj: any) => {
  const { existing, isTutor } = await getExistingProfile(userId);

  // ensure educationalInformation exists as array
  if (!Array.isArray((existing as any).educationalInformation)) {
    (existing as any).educationalInformation = [];
  }

  // push new entry (ensure createdAt/_id by mongoose)
  (existing as any).educationalInformation.push(educationObj);

  await existing.save();

  const populated = isTutor
    ? await Tutor.findById(existing._id).populate("userId")
    : await Guardian.findById(existing._id).populate("userId");

  return populated;
};

const updateEducation = async (
  userId: string,
  educationId: string,
  updateObj: any
) => {
  if (!mongoose.Types.ObjectId.isValid(educationId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid educationId");
  }

  const { existing, isTutor } = await getExistingProfile(userId);

  // find subdoc
  const subdoc =
    (existing as any).educationalInformation?.id?.(educationId) ?? null;
  if (!subdoc) {
    throw new AppError(httpStatus.NOT_FOUND, "Education entry not found");
  }

  // update allowed keys (set shallowly)
  Object.entries(updateObj).forEach(([k, v]) => {
    // don't allow updating _id
    if (k === "_id") return;
    // set value
    // convert strings like "null" to null? not doing that automatically. Keep direct assign.
    subdoc.set(k, v);
  });

  await existing.save();

  const populated = isTutor
    ? await Tutor.findById(existing._id).populate("userId")
    : await Guardian.findById(existing._id).populate("userId");

  return populated;
};

const deleteEducation = async (userId: string, educationId: string) => {
  if (!mongoose.Types.ObjectId.isValid(educationId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid educationId");
  }

  const { isTutor } = await getExistingProfile(userId);

  // Pull the subdoc by its _id (works whether subdocs are mongoose subdocs or plain objects)
  const updated = isTutor
    ? await Tutor.findOneAndUpdate(
        { userId: userId },
        { $pull: { educationalInformation: { _id: educationId } } },
        { new: true }
      ).populate("userId")
    : await Guardian.findOneAndUpdate(
        { userId: userId },
        { $pull: { educationalInformation: { _id: educationId } } },
        { new: true }
      ).populate("userId");

  if (!updated) {
    throw new AppError(httpStatus.NOT_FOUND, "Profile not found after delete");
  }

  return updated;
};

export const UserServices = {
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
  deleteEducation,
};

/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { Query } from "./query.model";
import AppError from "../../errors/AppError";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { sendSingleNotification } from "../../utils/sendSingleNotification";
import { infinitePaginate } from "../../utils/infinitePaginate";

export const generateTicketId = (): string => {
    const prefix = "AT";
    // Generate 6 random alphanumeric characters (uppercase)
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${randomChars}`;
};

/* User: Raise a Query */
const raiseQuery = async (
    userId: string,
    payload: {
        subject: string;
        issueType: string;
        description: string;
    },
    files?: Express.Multer.File[]
) => {
    // Upload attachments to Cloudinary
    let attachmentUrls: string[] = [];
    if (files && files.length > 0) {
        // Assuming you have a function to upload to Cloudinary
        const uploadPromises = files.map(async (file) => {
            const { secure_url } = await sendImageToCloudinary(
                `query-${userId}-${Date.now()}`,
                file.path
            );
            return secure_url;
        });
        attachmentUrls = await Promise.all(uploadPromises);
    }

    // Create query
    const query = await Query.create({
        ticketId: generateTicketId(),
        userId,
        subject: payload.subject,
        issueType: payload.issueType,
        description: payload.description,
        attachments: attachmentUrls,
        status: "pending",
    });

    // Send notification to user
    await sendSingleNotification(
        userId as any,
        "Query Received! 📝",
        `We have received your query "${payload.subject}". Our support team will get back to you within 24 hours. Query ID: ${query._id}`
    );

    // Also send notification to admins (you can implement admin notification if needed)
    // await sendNotificationToAdmins(`New query raised by user`, query._id);

    return query;
};

/* User: Get My Queries */
const getMyQueries = async (
    userId: string,
    skip = 0,
    limit = 10,
    filters: {
        status?: string;
    } = {},
) => {
    const query: any = { userId };

    // Status filter
    if (filters.status && filters.status !== "") {
        query.status = filters.status;
    }

    // Use infinitePaginate
    return infinitePaginate(Query, query, skip, limit, []);
};

/* User: Get Single Query */
const getSingleQuery = async (queryId: string, userId: string) => {
    const query = await Query.findOne({ _id: queryId, userId });

    if (!query) {
        throw new AppError(httpStatus.NOT_FOUND, "Query not found");
    }

    return query;
};

/* User: Add Attachment to Existing Query */
const addAttachment = async (
    queryId: string,
    userId: string,
    files: Express.Multer.File[]
) => {
    const query = await Query.findOne({ _id: queryId, userId });

    if (!query) {
        throw new AppError(httpStatus.NOT_FOUND, "Query not found");
    }

    if (query.status === "resolved") {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Cannot add attachment to resolved or closed query"
        );
    }

    // Upload attachments
    let attachmentUrls: string[] = [];
    if (files && files.length > 0) {
        const uploadPromises = files.map(async (file) => {
            const { secure_url } = await sendImageToCloudinary(
                `query-${userId}-${Date.now()}`,
                file.path
            );
            return secure_url;
        });
        attachmentUrls = await Promise.all(uploadPromises);
    }

    query.attachments = [...(query.attachments || []), ...attachmentUrls];
    await query.save();

    // Send notification
    await sendSingleNotification(
        userId as any,
        "Attachment Added 📎",
        `New attachment added to your query: ${query.subject}`
    );

    return query;
};

/* User: Delete My Query (Soft Delete or Hard Delete) */
const deleteMyQuery = async (queryId: string, userId: string) => {
  // Find the query and check if it belongs to the user
  const query = await Query.findOne({ _id: queryId, userId });

  if (!query) {
    throw new AppError(httpStatus.NOT_FOUND, "Query not found or you are not authorized");
  }

  // Optional: Prevent deletion of already resolved/closed queries
  if (query.status === "resolved") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete a resolved or closed query. Please contact support."
    );
  }

  // Option 1: Hard Delete (completely remove from database)
  await Query.findByIdAndDelete(queryId);

  // Option 2: Soft Delete (add isDeleted flag - recommended)
  // await Query.findByIdAndUpdate(queryId, { isDeleted: true });

  // Send notification
  await sendSingleNotification(
    userId as any,
    "Query Deleted 🗑️",
    `Your query "${query.subject}" has been successfully deleted from our system.`
  );

  return { message: "Query deleted successfully" };
};

/* Admin: Get All Queries */
const getAllQueries = async (
  filters: any = {},
  skip = 0,
  limit = 10
) => {

  const query: any = {};

  // Status filter
  if (filters.status) {
    query.status = filters.status;
  }

  // Issue type filter
  if (filters.issueType) {
    query.issueType = filters.issueType;
  }

    if (filters.keyword) {
    query.$text = {
      $search: filters.keyword,
    };
  }

  return infinitePaginate(Query, query, skip, limit, []);
};

/* Admin: Get Single Query (with user details) */
const getSingleQueryForAdmin = async (queryId: string) => {
    const query = await Query.findById(queryId).populate(
        "userId",
        "firstName lastName email phoneNumber profilePicture"
    );

    if (!query) {
        throw new AppError(httpStatus.NOT_FOUND, "Query not found");
    }

    return query;
};

/* Admin: Update Query Status and Feedback */
const updateQueryStatus = async (
    queryId: string,
    payload: {
        status: "pending" | "inProgress" | "resolved";
        adminFeedback?: string;
    }
) => {
    const query = await Query.findById(queryId);

    if (!query) {
        throw new AppError(httpStatus.NOT_FOUND, "Query not found");
    }

    const oldStatus = query.status;
    const newStatus = payload.status;

    // Update query
    const updateData: any = {
        status: payload.status,
        adminFeedback: payload.adminFeedback,
    };

    if (payload.status === "resolved") {
        updateData.resolvedAt = new Date();
    }

    const updatedQuery = await Query.findByIdAndUpdate(queryId, updateData, {
        new: true,
    }).populate("userId", "firstName lastName email phoneNumber");

    // Send notification based on status change
    let notificationTitle = "";
    let notificationMessage = "";

    if (oldStatus !== newStatus) {
        switch (newStatus) {
            case "inProgress":
                notificationTitle = "Query In Progress 🔧";
                notificationMessage = `Your query "${query.subject}" is now being reviewed by our team. We'll update you soon.`;
                break;
            case "resolved":
                notificationTitle = "Query Resolved ";
                notificationMessage = `Your query "${query.subject}" has been resolved. ${payload.adminFeedback ? `Feedback: ${payload.adminFeedback}` : ""
                    }`;
                break;
            default:
                notificationTitle = "Query Status Updated";
                notificationMessage = `Your query "${query.subject}" status has been updated to ${newStatus}.`;
        }

        // Send notification to user
        if (notificationTitle) {
            await sendSingleNotification(
                query.userId as any,
                notificationTitle,
                notificationMessage
            );
        }
    }

    // If admin provided feedback separately
    if (payload.adminFeedback && oldStatus === newStatus) {
        await sendSingleNotification(
            query.userId as any,
            "Admin Feedback 📝",
            `Admin responded to your query "${query.subject}": ${payload.adminFeedback}`
        );
    }

    return updatedQuery;
};

/* Admin: Delete Query */
const deleteQuery = async (queryId: string) => {
    const query = await Query.findByIdAndDelete(queryId);

    if (!query) {
        throw new AppError(httpStatus.NOT_FOUND, "Query not found");
    }

    // Send notification
    await sendSingleNotification(
        query.userId as any,
        "Query Deleted 🗑️",
        `Your query "${query.subject}" has been removed from our system. If this was a mistake, please raise a new query.`
    );

    return query;
};

export const QueryServices = {
    raiseQuery,
    getMyQueries,
    getSingleQuery,
    addAttachment,
    deleteMyQuery,
    getAllQueries,
    getSingleQueryForAdmin,
    updateQueryStatus,
    deleteQuery,
};
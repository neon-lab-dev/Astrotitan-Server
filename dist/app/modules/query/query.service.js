"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryServices = exports.generateTicketId = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const query_model_1 = require("./query.model");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
const sendSingleNotification_1 = require("../../utils/sendSingleNotification");
const infinitePaginate_1 = require("../../utils/infinitePaginate");
const generateTicketId = () => {
    const prefix = "AT";
    // Generate 6 random alphanumeric characters (uppercase)
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${randomChars}`;
};
exports.generateTicketId = generateTicketId;
/* User: Raise a Query */
const raiseQuery = (userId, payload, files) => __awaiter(void 0, void 0, void 0, function* () {
    // Upload attachments to Cloudinary
    let attachmentUrls = [];
    if (files && files.length > 0) {
        // Assuming you have a function to upload to Cloudinary
        const uploadPromises = files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`query-${userId}-${Date.now()}`, file.path);
            return secure_url;
        }));
        attachmentUrls = yield Promise.all(uploadPromises);
    }
    // Create query
    const query = yield query_model_1.Query.create({
        ticketId: (0, exports.generateTicketId)(),
        userId,
        subject: payload.subject,
        issueType: payload.issueType,
        description: payload.description,
        attachments: attachmentUrls,
        status: "pending",
    });
    // Send notification to user
    yield (0, sendSingleNotification_1.sendSingleNotification)(userId, "Query Received! 📝", `We have received your query "${payload.subject}". Our support team will get back to you within 24 hours. Query ID: ${query._id}`);
    // Also send notification to admins (you can implement admin notification if needed)
    // await sendNotificationToAdmins(`New query raised by user`, query._id);
    return query;
});
/* User: Get My Queries */
const getMyQueries = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, skip = 0, limit = 10, filters = {}) {
    const query = { userId };
    // Status filter
    if (filters.status && filters.status !== "") {
        query.status = filters.status;
    }
    // Use infinitePaginate
    return (0, infinitePaginate_1.infinitePaginate)(query_model_1.Query, query, skip, limit, []);
});
/* User: Get Single Query */
const getSingleQuery = (queryId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = yield query_model_1.Query.findOne({ _id: queryId, userId });
    if (!query) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Query not found");
    }
    return query;
});
/* User: Add Attachment to Existing Query */
const addAttachment = (queryId, userId, files) => __awaiter(void 0, void 0, void 0, function* () {
    const query = yield query_model_1.Query.findOne({ _id: queryId, userId });
    if (!query) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Query not found");
    }
    if (query.status === "resolved") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Cannot add attachment to resolved or closed query");
    }
    // Upload attachments
    let attachmentUrls = [];
    if (files && files.length > 0) {
        const uploadPromises = files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(`query-${userId}-${Date.now()}`, file.path);
            return secure_url;
        }));
        attachmentUrls = yield Promise.all(uploadPromises);
    }
    query.attachments = [...(query.attachments || []), ...attachmentUrls];
    yield query.save();
    // Send notification
    yield (0, sendSingleNotification_1.sendSingleNotification)(userId, "Attachment Added 📎", `New attachment added to your query: ${query.subject}`);
    return query;
});
/* User: Delete My Query (Soft Delete or Hard Delete) */
const deleteMyQuery = (queryId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the query and check if it belongs to the user
    const query = yield query_model_1.Query.findOne({ _id: queryId, userId });
    if (!query) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Query not found or you are not authorized");
    }
    // Optional: Prevent deletion of already resolved/closed queries
    if (query.status === "resolved") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Cannot delete a resolved or closed query. Please contact support.");
    }
    // Option 1: Hard Delete (completely remove from database)
    yield query_model_1.Query.findByIdAndDelete(queryId);
    // Option 2: Soft Delete (add isDeleted flag - recommended)
    // await Query.findByIdAndUpdate(queryId, { isDeleted: true });
    // Send notification
    yield (0, sendSingleNotification_1.sendSingleNotification)(userId, "Query Deleted 🗑️", `Your query "${query.subject}" has been successfully deleted from our system.`);
    return { message: "Query deleted successfully" };
});
/* Admin: Get All Queries */
const getAllQueries = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
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
    return (0, infinitePaginate_1.infinitePaginate)(query_model_1.Query, query, skip, limit, []);
});
/* Admin: Get Single Query (with user details) */
const getSingleQueryForAdmin = (queryId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = yield query_model_1.Query.findById(queryId).populate("userId", "firstName lastName email phoneNumber profilePicture");
    if (!query) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Query not found");
    }
    return query;
});
/* Admin: Update Query Status and Feedback */
const updateQueryStatus = (queryId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const query = yield query_model_1.Query.findById(queryId);
    if (!query) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Query not found");
    }
    const oldStatus = query.status;
    const newStatus = payload.status;
    // Update query
    const updateData = {
        status: payload.status,
        adminFeedback: payload.adminFeedback,
    };
    if (payload.status === "resolved") {
        updateData.resolvedAt = new Date();
    }
    const updatedQuery = yield query_model_1.Query.findByIdAndUpdate(queryId, updateData, {
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
                notificationTitle = "Query Resolved ✅";
                notificationMessage = `Your query "${query.subject}" has been resolved. ${payload.adminFeedback ? `Feedback: ${payload.adminFeedback}` : ""}`;
                break;
            default:
                notificationTitle = "Query Status Updated";
                notificationMessage = `Your query "${query.subject}" status has been updated to ${newStatus}.`;
        }
        // Send notification to user
        if (notificationTitle) {
            yield (0, sendSingleNotification_1.sendSingleNotification)(query.userId, notificationTitle, notificationMessage);
        }
    }
    // If admin provided feedback separately
    if (payload.adminFeedback && oldStatus === newStatus) {
        yield (0, sendSingleNotification_1.sendSingleNotification)(query.userId, "Admin Feedback 📝", `Admin responded to your query "${query.subject}": ${payload.adminFeedback}`);
    }
    return updatedQuery;
});
/* Admin: Delete Query */
const deleteQuery = (queryId) => __awaiter(void 0, void 0, void 0, function* () {
    const query = yield query_model_1.Query.findByIdAndDelete(queryId);
    if (!query) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Query not found");
    }
    // Send notification
    yield (0, sendSingleNotification_1.sendSingleNotification)(query.userId, "Query Deleted 🗑️", `Your query "${query.subject}" has been removed from our system. If this was a mistake, please raise a new query.`);
    return query;
});
exports.QueryServices = {
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Query = void 0;
const mongoose_1 = require("mongoose");
const query_interface_1 = require("./query.interface");
const querySchema = new mongoose_1.Schema({
    ticketId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Accounts",
        required: true,
        index: true,
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
        index: true, // Add text index for search
    },
    issueType: {
        type: String,
        enum: query_interface_1.IssueTypeList,
        required: true,
        index: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
    },
    attachments: {
        type: [String],
        default: [],
    },
    status: {
        type: String,
        enum: ["pending", "inProgress", "resolved",],
        default: "pending",
        index: true,
    },
    adminFeedback: {
        type: String,
        trim: true,
    },
    resolvedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Single field indexes
querySchema.index({ ticketId: 1 });
querySchema.index({ userId: 1, status: 1 });
querySchema.index({ createdAt: -1 });
querySchema.index({ issueType: 1, status: 1 });
querySchema.index({ subject: 1 });
// Text index for searching across multiple fields (subject, ticketId, description)
querySchema.index({
    subject: "text",
    ticketId: "text",
    description: "text",
}, {
    weights: {
        subject: 10, // Higher weight for subject
        ticketId: 8, // Medium weight for ticket ID
        description: 5, // Lower weight for description
    },
    name: "query_search_index",
});
exports.Query = (0, mongoose_1.model)("Query", querySchema);

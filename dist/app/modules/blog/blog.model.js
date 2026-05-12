"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blog = void 0;
const mongoose_1 = require("mongoose");
const blog_interface_1 = require("./blog.interface");
const zodiacSpecificSchema = new mongoose_1.Schema({
    zodiacSign: { type: String, required: true },
    dateRange: { type: String },
    element: { type: String },
    luckyColor: { type: String },
    luckyNumber: { type: Number },
    compatibility: { type: [String] },
});
const blogSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    category: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    content: {
        type: String,
        required: true,
    },
    addedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Astrologer",
        required: true,
        index: true,
    },
    blogType: {
        type: String,
        enum: blog_interface_1.BlogTypeList,
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: blog_interface_1.BlogStatusList,
        default: "draft",
        index: true,
    },
    zodiacSpecific: {
        type: zodiacSpecificSchema,
        required: false,
    },
    thumbnail: {
        type: String,
        default: "",
    },
    views: {
        type: Number,
        default: 0,
    },
    likes: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
// Indexes for search and filtering
blogSchema.index({ title: "text", content: "text", category: "text" });
blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ blogType: 1, status: 1 });
blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ addedBy: 1, createdAt: -1 });
blogSchema.index({ views: -1 });
blogSchema.index({ likes: -1 });
blogSchema.index({ createdAt: -1 });
exports.Blog = (0, mongoose_1.model)("Blog", blogSchema);

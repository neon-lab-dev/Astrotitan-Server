import { Schema, model } from "mongoose";
import { TBlog, BlogTypeList } from "./blog.interface";

const zodiacSpecificSchema = new Schema({
  zodiacSign: { type: String, required: true },
  dateRange: { type: String },
  element: { type: String },
  luckyColor: { type: String },
  luckyNumber: { type: Number },
  compatibility: { type: [String] },
});

const blogSchema = new Schema<TBlog>(
  {
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
      type: Schema.Types.ObjectId,
      ref: "Astrologer",
      required: true,
      index: true,
    },
    blogType: {
      type: String,
      enum: BlogTypeList,
      required: true,
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
  },
  {
    timestamps: true,
  }
);

// Indexes for search and filtering
blogSchema.index({ title: "text", content: "text", category: "text" });
blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ blogType: 1, status: 1 });
blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ addedBy: 1, createdAt: -1 });
blogSchema.index({ views: -1 });
blogSchema.index({ likes: -1 });
blogSchema.index({ createdAt: -1 });

export const Blog = model<TBlog>("Blog", blogSchema);
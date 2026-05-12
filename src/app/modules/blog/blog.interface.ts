import { ObjectId } from "mongoose";

export const BlogTypeList = ["article", "zodiacTips"] as const;
export const BlogStatusList = ["draft", "live"] as const;

export type TBlogType = typeof BlogTypeList[number];
export type TBlogStatus = typeof BlogStatusList[number];

export type TZodiacSpecific = {
  zodiacSign: string;
  dateRange?: string;
  element?: string;
  luckyColor?: string;
  luckyNumber?: number;
  compatibility?: string[];
};

export type TBlog = {
  _id: string;
  title: string;
  category: string;
  content: string;
  addedBy: ObjectId;
  blogType: TBlogType;
  status: TBlogStatus;
  zodiacSpecific?: TZodiacSpecific;
  thumbnail: string;
  views?: number;
  likes?: number;
  createdAt?: Date;
  updatedAt?: Date;
};
import { ObjectId } from "mongoose";

export const IssueTypeList = [
  "account",
  "payment", 
  "product",
  "puja",
  "consultation",
  "astrology",
  "technical",
  "report",
  "refund",
  "cancellation",
  "delivery",
  "feedback",
  "other"
] as const;

export type TIssueType = typeof IssueTypeList[number];


export type TQuery = {
  _id: string;
  ticketId : string;
  userId: ObjectId;
  subject: string;
  issueType: TIssueType;
  description: string;
  attachments?: string[];
  status: "pending" | "inProgress" | "resolved";
  adminFeedback?: string;
  resolvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};
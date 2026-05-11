import { ObjectId } from "mongoose";

export type TPujaBooking = {
  _id: string;
  userId: ObjectId;
  name: string;
  phoneNumber: string;
  pujaId: ObjectId;
  preferredDate: Date;
  purposeOfPuja: string;
  status: "pending" | "contacted" | "booked" | "notInterested";
  adminNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
};
import { ObjectId } from "mongoose";

export type TConsultationChat = {
    _id: string;
    consultationId: ObjectId;  // Reference to Consultation
    sender: ObjectId;           // Reference to Accounts
    receiver: ObjectId;         // Reference to Accounts
    content: string;
    status: "sent" | "delivered" | "read";
    readAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
};
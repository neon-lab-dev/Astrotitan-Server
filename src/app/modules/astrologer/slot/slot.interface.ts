import { ObjectId } from "mongoose"

export type TSlot = {
    astrologerId: ObjectId,
    date: Date,
    slots: {
        startTime: string,
        endTime: string,
        isBooked: boolean
    }
}
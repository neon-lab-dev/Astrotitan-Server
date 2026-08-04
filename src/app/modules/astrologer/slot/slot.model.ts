// modules/astrologer/slot/slot.model.ts
import { model, Schema, Types } from "mongoose";
import { TSlot } from "./slot.interface";

const SlotSchema = new Schema<TSlot>(
    {
        astrologerId: {
            type: Types.ObjectId,
            ref: "Astrologer",
            required: true,
            index: true,
        },
        date: {
            type: Date,
            required: true,
            index: true,
        },
        slots: [
            {
                startTime: {
                    type: String,
                    required: true,
                },
                endTime: {
                    type: String,
                    required: true,
                },
                isBooked: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

//  Compound index for faster queries
SlotSchema.index({ astrologerId: 1, date: 1 });

//  Index for checking availability
SlotSchema.index({ "slots.isBooked": 1 });

const Slot = model<TSlot>("Slot", SlotSchema);
export default Slot;
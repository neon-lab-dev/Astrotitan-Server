"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// modules/astrologer/slot/slot.model.ts
const mongoose_1 = require("mongoose");
const SlotSchema = new mongoose_1.Schema({
    astrologerId: {
        type: mongoose_1.Types.ObjectId,
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
}, {
    timestamps: true,
});
//  Compound index for faster queries
SlotSchema.index({ astrologerId: 1, date: 1 });
//  Index for checking availability
SlotSchema.index({ "slots.isBooked": 1 });
const Slot = (0, mongoose_1.model)("Slot", SlotSchema);
exports.default = Slot;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoiceId = generateInvoiceId;
const counter_model_1 = require("../counter.model");
function generateInvoiceId() {
    return __awaiter(this, void 0, void 0, function* () {
        const counter = yield counter_model_1.Counter.findOneAndUpdate({ name: "invoiceCounter" }, { $inc: { value: 1 } }, { new: true, upsert: true });
        const value = counter.value;
        // 01 → 99 → 100 → 101
        return value < 100
            ? value.toString().padStart(2, "0")
            : value.toString();
    });
}

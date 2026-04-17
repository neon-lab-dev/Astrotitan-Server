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
exports.generateSequentialId = generateSequentialId;
const counter_model_1 = require("../counter.model");
function generateSequentialId(prefixOrCounterName, counterName) {
    return __awaiter(this, void 0, void 0, function* () {
        let prefix = "";
        let counterKey = "";
        if (counterName) {
            prefix = prefixOrCounterName;
            counterKey = counterName;
        }
        else {
            counterKey = prefixOrCounterName;
        }
        const counter = yield counter_model_1.Counter.findOneAndUpdate({ name: counterKey }, { $inc: { value: 1 } }, { new: true, upsert: true });
        const numberPart = counter.value.toString().padStart(3, "0");
        return `${prefix}${numberPart}`;
    });
}

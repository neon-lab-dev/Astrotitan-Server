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
exports.UserServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const accounts_model_1 = require("../accounts/accounts.model");
const getAllUser = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield accounts_model_1.Accounts.find();
    return result;
});
const getSingleUserById = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield accounts_model_1.Accounts.findById(userId);
    return result;
});
// Activate user back
const deleteAccount = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield accounts_model_1.Accounts.findById(userId);
    if (!user)
        throw new Error("User not found");
    user.isDeleted = true;
    user.accountDeleteReason = payload.accountDeleteReason || null;
    yield user.save();
    return user;
});
// Activate user back
const restoreDeletedAccount = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield accounts_model_1.Accounts.findByIdAndUpdate(userId, { isDeleted: false });
    if (!user)
        throw new Error("User not found");
    return user;
});
exports.UserServices = {
    getAllUser,
    getSingleUserById,
    deleteAccount,
    restoreDeletedAccount,
};

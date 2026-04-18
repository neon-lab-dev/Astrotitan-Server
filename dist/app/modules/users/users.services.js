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
const infinitePaginate_1 = require("../../utils/infinitePaginate");
const accounts_model_1 = require("../accounts/accounts.model");
const user_model_1 = require("./user.model");
const getAllUser = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
    // Search functionality (search on firstName and lastName)
    if (filters.keyword) {
        query.$or = [
            { firstName: { $regex: filters.keyword, $options: "i" } },
            { lastName: { $regex: filters.keyword, $options: "i" } },
        ];
    }
    // Filter by gender
    if (filters.gender) {
        query.gender = filters.gender;
    }
    // Filter by country
    if (filters.country) {
        query.country = { $regex: filters.country, $options: "i" };
    }
    // Get paginated results
    const result = yield (0, infinitePaginate_1.infinitePaginate)(user_model_1.User, query, skip, limit, []);
    // Populate account details for each user
    const usersWithAccount = yield Promise.all(result.data.map((user) => __awaiter(void 0, void 0, void 0, function* () {
        const account = yield accounts_model_1.Accounts.findById(user.accountId).select("-otp -loginOtp -resetOtp -password");
        return Object.assign(Object.assign({}, user.toObject()), { accountDetails: account });
    })));
    return {
        data: usersWithAccount,
        meta: result.meta,
    };
});
const getSingleUserById = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_model_1.User.findById(userId).populate("accountId");
    return result;
});
exports.UserServices = {
    getAllUser,
    getSingleUserById,
};

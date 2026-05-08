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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const address_model_1 = require("./address.model");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
/* Add Address */
const addAddress = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const address = yield address_model_1.Address.create(Object.assign({ userId }, payload));
    return address;
});
/* Get My Addresses */
const getMyAddresses = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const addresses = yield address_model_1.Address.find({ userId })
        .sort({ isDefault: -1, createdAt: -1 });
    return addresses;
});
/* Get Single Address */
const getSingleAddress = (addressId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const address = yield address_model_1.Address.findOne({ _id: addressId, userId });
    if (!address) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Address not found");
    }
    return address;
});
/* Update Address */
const updateAddress = (addressId, userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if address exists
    const existingAddress = yield address_model_1.Address.findOne({ _id: addressId, userId });
    if (!existingAddress) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Address not found");
    }
    // If setting this address as default, remove default from others
    if (payload.isDefault) {
        yield address_model_1.Address.updateMany({ userId, _id: { $ne: addressId } }, { isDefault: false });
    }
    const address = yield address_model_1.Address.findOneAndUpdate({ _id: addressId, userId }, payload, { new: true, runValidators: true });
    return address;
});
/* Delete Address */
const deleteAddress = (addressId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const address = yield address_model_1.Address.findOne({ _id: addressId, userId });
    if (!address) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Address not found");
    }
    yield address_model_1.Address.findByIdAndDelete(addressId);
    return { message: "Address deleted successfully" };
});
exports.AddressServices = {
    addAddress,
    getMyAddresses,
    getSingleAddress,
    updateAddress,
    deleteAddress,
};

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
exports.Accounts = void 0;
const mongoose_1 = require("mongoose");
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = __importDefault(require("../../config"));
// function generateUserId() {
//   const prefix = "AST";
//   const date = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
//   const random = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6-char random
//   return `${prefix}-${date}-${random}`;
// }
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
        index: true,
    },
    phoneNumber: {
        type: String,
        required: false,
        trim: true,
        sparse: true,
        index: true,
    },
    role: {
        type: String,
        enum: ["user", "admin", "astrologer"],
        required: true,
        default: "user",
        index: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
    isSuspended: {
        type: Boolean,
        default: false,
        index: true,
    },
    isOtpVerified: {
        type: Boolean,
        default: false,
        index: true,
    },
    otp: {
        type: String,
        default: null,
    },
    otpExpireAt: {
        type: Date,
        default: null,
        index: true,
    },
    resetOtp: {
        type: String,
        default: null,
    },
    resetOtpExpireAt: {
        type: Date,
        default: null,
    },
    isResetOtpVerified: {
        type: Boolean,
        default: null,
    },
    loginOtp: {
        type: String,
        default: null,
    },
    loginOtpExpireAt: {
        type: Date,
        default: null,
    },
    passwordChangedAt: {
        type: Date,
    },
    suspensionReason: {
        type: String,
        trim: true,
        default: null,
    },
    accountDeleteReason: {
        type: String,
        trim: true,
        default: null,
    },
    expoPushToken: {
        type: String,
        default: null,
    },
    password: {
        type: String,
        select: false,
    },
}, {
    timestamps: true,
});
// Hashing password before saving
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isModified("password")) {
            this.password = yield bcrypt_1.default.hash(this.password, Number(config_1.default.bcrypt_salt_round));
        }
        next();
    });
});
// Hide password after saving
userSchema.post("save", function (doc, next) {
    doc.password = "";
    next();
});
// Static methods
userSchema.statics.isUserExists = function (email) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.findOne({ email }).select("+password");
    });
};
userSchema.statics.isPasswordMatched = function (plainTextPassword, hashedPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcrypt_1.default.compare(plainTextPassword, hashedPassword);
    });
};
// Compound indexes for common query patterns
userSchema.index({ role: 1, isDeleted: 1 });
userSchema.index({ role: 1, isSuspended: 1 });
userSchema.index({ isDeleted: 1, isSuspended: 1 });
userSchema.index({ role: 1, isOtpVerified: 1 });
userSchema.index({ createdAt: -1 }); // For sorting by recent
userSchema.index({ updatedAt: -1 });
// Text index for search functionality (firstName, lastName, email, placeOfBirth)
userSchema.index({
    firstName: "text",
    lastName: "text",
    email: "text",
    placeOfBirth: "text",
}, {
    weights: {
        firstName: 10, // Higher weight = more relevant
        lastName: 10,
        email: 5,
        placeOfBirth: 3,
    },
    name: "user_search_index",
});
// Compound index for filtering by intents (array field)
userSchema.index({ intents: 1, role: 1, isDeleted: 1 });
// Compound index for date range queries
userSchema.index({ dateOfBirth: 1, role: 1 });
// Index for OTP expiration cleanup
userSchema.index({ otpExpireAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { isOtpVerified: false } });
// Remove password from response
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};
// Static methods
userSchema.statics.isUserExists = function (email) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.findOne({ email }).select("+password");
    });
};
userSchema.statics.isPasswordMatched = function (plainTextPassword, hashedPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcrypt_1.default.compare(plainTextPassword, hashedPassword);
    });
};
exports.Accounts = (0, mongoose_1.model)("Accounts", userSchema);

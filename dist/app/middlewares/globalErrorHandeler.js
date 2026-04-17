"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const config_1 = __importDefault(require("../config"));
const ZodError_1 = __importDefault(require("../errors/ZodError"));
const ValidationError_1 = __importDefault(require("../errors/ValidationError"));
const CastError_1 = __importDefault(require("../errors/CastError"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const globalErrorHandler = (err, req, res, next // add next
) => {
    let statusCode = 500;
    let message = "Something went wrong!";
    let errorSourse = [
        {
            path: "",
            message: "Something went wrong!",
        },
    ];
    if (err instanceof zod_1.ZodError) {
        const simplifiedError = (0, ZodError_1.default)(err);
        statusCode = (simplifiedError === null || simplifiedError === void 0 ? void 0 : simplifiedError.statusCode) || 400;
        message = simplifiedError === null || simplifiedError === void 0 ? void 0 : simplifiedError.message;
        errorSourse = simplifiedError === null || simplifiedError === void 0 ? void 0 : simplifiedError.errorSources;
    }
    else if ((err === null || err === void 0 ? void 0 : err.name) === "ValidationError") {
        const simplifiedError = (0, ValidationError_1.default)(err);
        statusCode = (simplifiedError === null || simplifiedError === void 0 ? void 0 : simplifiedError.statusCode) || 400;
        message = simplifiedError === null || simplifiedError === void 0 ? void 0 : simplifiedError.message;
        errorSourse = simplifiedError === null || simplifiedError === void 0 ? void 0 : simplifiedError.errorSources;
    }
    else if ((err === null || err === void 0 ? void 0 : err.name) === "CastError") {
        const simplifiedError = (0, CastError_1.default)(err);
        statusCode = (simplifiedError === null || simplifiedError === void 0 ? void 0 : simplifiedError.statusCode) || 400;
        message = simplifiedError === null || simplifiedError === void 0 ? void 0 : simplifiedError.message;
        errorSourse = simplifiedError === null || simplifiedError === void 0 ? void 0 : simplifiedError.errorSources;
    }
    else if (err instanceof AppError_1.default) {
        statusCode = err === null || err === void 0 ? void 0 : err.statusCode;
        message = err === null || err === void 0 ? void 0 : err.message;
        errorSourse = [{
                path: "",
                message: err === null || err === void 0 ? void 0 : err.message
            }];
    }
    else if (err instanceof Error) {
        message = err.message;
        errorSourse = [
            {
                path: "",
                message: err.message,
            },
        ];
    }
    return res.status(statusCode).json({
        success: false,
        message,
        errorSourse,
        stack: config_1.default.node_env === "development" ? err.stack : null,
    });
};
exports.default = globalErrorHandler;

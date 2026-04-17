"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.sendImageToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
/* =======================
   Cloudinary Config
======================= */
cloudinary_1.v2.config({
    cloud_name: config_1.default.cloudinary_cloud_name,
    api_key: config_1.default.cloudinary_api_key,
    api_secret: config_1.default.cloudinary_api_secret,
});
/* =======================
   Upload to Cloudinary
======================= */
const sendImageToCloudinary = (imageName, filePath) => {
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader.upload(filePath, { public_id: imageName, resource_type: "image" }, (error, result) => {
            if (error || !(result === null || result === void 0 ? void 0 : result.secure_url)) {
                return reject(error || new Error("Cloudinary upload failed"));
            }
            // Resolve FIRST (important)
            resolve({ secure_url: result.secure_url });
            // Cleanup — never reject after success
            fs_1.default.unlink(filePath, (err) => {
                if (err)
                    console.error("File delete failed:", err);
            });
        });
    });
};
exports.sendImageToCloudinary = sendImageToCloudinary;
/* =======================
   Multer Config
======================= */
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, path_1.default.join(process.cwd(), "uploads"));
    },
    filename: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, uniqueName);
    },
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB Max
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            cb(new Error("Only JPG, JPEG, PNG images are allowed"));
        }
        else {
            cb(null, true);
        }
    },
});

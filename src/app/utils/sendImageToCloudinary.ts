import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import multer from "multer";
import fs from "fs";
import path from "path";
import config from "../config";

interface CloudinaryResponse {
  secure_url: string;
}

/* =======================
   Cloudinary Config
======================= */
cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

/* =======================
   Upload to Cloudinary
======================= */
export const sendImageToCloudinary = (
  imageName: string,
  filePath: string
): Promise<CloudinaryResponse> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      { public_id: imageName, resource_type: "image" },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result?.secure_url) {
          return reject(error || new Error("Cloudinary upload failed"));
        }

        // Resolve FIRST (important)
        resolve({ secure_url: result.secure_url });

        // Cleanup — never reject after success
        fs.unlink(filePath, (err) => {
          if (err) console.error("File delete failed:", err);
        });
      }
    );
  });
};

/* =======================
   Multer Config
======================= */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${ext}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB Max
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error("Only JPG, JPEG, PNG images are allowed"));
    } else {
      cb(null, true);
    }
  },
});
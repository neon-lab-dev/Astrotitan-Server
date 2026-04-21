import express from "express";
import { ProductControllers } from "./product.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../accounts/accounts.constants";
import { multerUpload } from "../../config/multer.config";

const router = express.Router();

router.post(
  "/add",
  auth(UserRole.admin),
  multerUpload.array("files", 4),
  ProductControllers.addProduct
);

router.get(
  "/",
  ProductControllers.getAllProducts
);


router.get(
  "/:productId",
  ProductControllers.getSingleProductById
);

router.patch(
  "/update/:productId",
  auth(UserRole.admin),
  multerUpload.array("files", 4),
  ProductControllers.updateProduct
);

router.delete(
  "/delete/:productId",
  auth(UserRole.user),
  ProductControllers.deleteProduct
);

// Review Routes
router.post(
  "/add-review/:productId",
  auth(UserRole.user, UserRole.astrologer),
  multerUpload.array("files", 5), // Max 5 images per review
  ProductControllers.addReview
);

router.patch(
  "/update-review/:productId/:reviewId",
  auth(UserRole.user, UserRole.astrologer),
  multerUpload.array("files", 5),
  ProductControllers.updateReview
);

router.delete(
  "/delete-review/:productId/:reviewId",
  auth(UserRole.user, UserRole.astrologer),
  ProductControllers.deleteReview
);



export const ProductRoutes = router;
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRoutes = void 0;
const express_1 = __importDefault(require("express"));
const product_controller_1 = require("./product.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const accounts_constants_1 = require("../accounts/accounts.constants");
const multer_config_1 = require("../../config/multer.config");
const router = express_1.default.Router();
router.post("/add", (0, auth_1.default)(accounts_constants_1.UserRole.admin), multer_config_1.multerUpload.array("files", 4), product_controller_1.ProductControllers.addProduct);
router.get("/", product_controller_1.ProductControllers.getAllProducts);
router.get("/:productId", product_controller_1.ProductControllers.getSingleProductById);
router.patch("/update/:productId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), multer_config_1.multerUpload.array("files", 4), product_controller_1.ProductControllers.updateProduct);
router.delete("/delete/:productId", (0, auth_1.default)(accounts_constants_1.UserRole.user), product_controller_1.ProductControllers.deleteProduct);
// Review Routes
router.post("/add-review/:productId", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), multer_config_1.multerUpload.array("files", 5), // Max 5 images per review
product_controller_1.ProductControllers.addReview);
router.patch("/update-review/:productId/:reviewId", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), multer_config_1.multerUpload.array("files", 5), product_controller_1.ProductControllers.updateReview);
router.delete("/delete-review/:productId/:reviewId", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), product_controller_1.ProductControllers.deleteReview);
exports.ProductRoutes = router;

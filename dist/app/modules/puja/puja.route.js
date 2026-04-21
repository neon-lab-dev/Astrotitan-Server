"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PujaRoutes = void 0;
const express_1 = __importDefault(require("express"));
const puja_controller_1 = require("./puja.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const accounts_constants_1 = require("../accounts/accounts.constants");
const multer_1 = __importDefault(require("multer"));
const multerUpload = (0, multer_1.default)({ dest: "uploads/" });
const router = express_1.default.Router();
router.post("/add", (0, auth_1.default)(accounts_constants_1.UserRole.admin), multerUpload.array("files", 10), puja_controller_1.PujaControllers.addPuja);
router.get("/", puja_controller_1.PujaControllers.getAllPujas);
router.get("/:pujaId", puja_controller_1.PujaControllers.getSinglePujaById);
router.patch("/update/:pujaId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), multerUpload.array("files", 10), puja_controller_1.PujaControllers.updatePuja);
router.delete("/delete/:pujaId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), puja_controller_1.PujaControllers.deletePuja);
// Review Routes
router.post("/add-review/:pujaId", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), multerUpload.array("files", 5), puja_controller_1.PujaControllers.addReview);
router.patch("/update-review/:pujaId/:reviewId", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), multerUpload.array("files", 5), puja_controller_1.PujaControllers.updateReview);
router.delete("/delete-review/:pujaId/:reviewId", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), puja_controller_1.PujaControllers.deleteReview);
exports.PujaRoutes = router;

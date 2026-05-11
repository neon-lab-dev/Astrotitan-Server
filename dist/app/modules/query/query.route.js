"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const query_controller_1 = require("./query.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const accounts_constants_1 = require("../accounts/accounts.constants");
const multer_1 = __importDefault(require("multer"));
const multerUpload = (0, multer_1.default)({ dest: "uploads/" });
const router = express_1.default.Router();
// User Routes
router.post("/raise", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), multerUpload.array("attachments"), query_controller_1.QueryControllers.raiseQuery);
router.get("/my-queries", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), query_controller_1.QueryControllers.getMyQueries);
router.get("/my-queries/:queryId", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), query_controller_1.QueryControllers.getSingleQuery);
router.patch("/my-queries/:queryId/attachments", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), multerUpload.array("attachments"), query_controller_1.QueryControllers.addAttachment);
router.delete("/my-queries/delete/:queryId", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), query_controller_1.QueryControllers.deleteMyQuery);
// Admin Routes
router.get("/", (0, auth_1.default)(accounts_constants_1.UserRole.admin), query_controller_1.QueryControllers.getAllQueries);
router.get("/:queryId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), query_controller_1.QueryControllers.getSingleQueryForAdmin);
router.patch("/update-status/:queryId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), query_controller_1.QueryControllers.updateQueryStatus);
router.delete("/delete/:queryId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), query_controller_1.QueryControllers.deleteQuery);
exports.QueryRoutes = router;

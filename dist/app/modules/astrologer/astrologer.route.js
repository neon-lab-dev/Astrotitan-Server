"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstrologerRoutes = void 0;
const express_1 = __importDefault(require("express"));
const astrologer_controller_1 = require("./astrologer.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const accounts_constants_1 = require("../accounts/accounts.constants");
const router = express_1.default.Router();
// Admin routes
router.get("/", (0, auth_1.default)(accounts_constants_1.UserRole.admin, accounts_constants_1.UserRole.user), astrologer_controller_1.AstrologerControllers.getAllAstrologer);
router.get("/pending-identity", (0, auth_1.default)(accounts_constants_1.UserRole.admin), astrologer_controller_1.AstrologerControllers.getPendingIdentityRequests);
router.get("/:astrologerId", (0, auth_1.default)(accounts_constants_1.UserRole.admin, accounts_constants_1.UserRole.user), astrologer_controller_1.AstrologerControllers.getSingleAstrologerById);
router.patch("/update-identity-status/:astrologerId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), astrologer_controller_1.AstrologerControllers.updateIdentityStatus);
// Review Routes (Protected - User only)
router.post("/review/add/:astrologerId", (0, auth_1.default)(accounts_constants_1.UserRole.user), astrologer_controller_1.AstrologerControllers.addReview);
router.patch("/review/update/:astrologerId", (0, auth_1.default)(accounts_constants_1.UserRole.user), astrologer_controller_1.AstrologerControllers.updateReview);
router.delete("/review/delete/:astrologerId", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.admin), astrologer_controller_1.AstrologerControllers.deleteReview);
exports.AstrologerRoutes = router;

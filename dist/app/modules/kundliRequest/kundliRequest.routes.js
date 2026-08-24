"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KundliRequestRoutes = void 0;
const express_1 = __importDefault(require("express"));
const kundliRequest_controller_1 = require("./kundliRequest.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const accounts_constants_1 = require("../accounts/accounts.constants");
const multer_config_1 = require("../../config/multer.config");
const router = express_1.default.Router();
// Send Kundli Request (User)
router.post("/", (0, auth_1.default)(accounts_constants_1.UserRole.user), multer_config_1.multerUpload.array("files", 5), kundliRequest_controller_1.KundliRequestControllers.sendKundliRequest);
// Get My Kundli Requests (User)
router.get("/all", (0, auth_1.default)(accounts_constants_1.UserRole.admin), kundliRequest_controller_1.KundliRequestControllers.getAllKundliRequests);
// Get My Kundli Requests (User)
router.get("/my-requests", (0, auth_1.default)(accounts_constants_1.UserRole.user), kundliRequest_controller_1.KundliRequestControllers.getMyKundliRequests);
// Get Kundli Requests for Astrologer
router.get("/astrologer-requests", (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), kundliRequest_controller_1.KundliRequestControllers.getAstrologerKundliRequests);
router.get("/:requestId", (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer, accounts_constants_1.UserRole.admin), kundliRequest_controller_1.KundliRequestControllers.getSingleKundliRequestById);
// Submit Kundli Report (Astrologer)
router.post("/:requestId/submit-report", (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), multer_config_1.multerUpload.single("file"), kundliRequest_controller_1.KundliRequestControllers.submitKundliReport);
// Assign Kundli Request to Astrologer
router.put("/assign-astrologer/:requestId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), kundliRequest_controller_1.KundliRequestControllers.assignAstrologer);
exports.KundliRequestRoutes = router;

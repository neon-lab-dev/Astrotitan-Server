"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = __importDefault(require("express"));
const users_controller_1 = require("./users.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const accounts_constants_1 = require("../accounts/accounts.constants");
const router = express_1.default.Router();
router.get("/", (0, auth_1.default)(accounts_constants_1.UserRole.admin), users_controller_1.UserControllers.getAllUser);
router.get("/:userId", (0, auth_1.default)(accounts_constants_1.UserRole.admin), users_controller_1.UserControllers.getSingleUserById);
exports.userRoutes = router;

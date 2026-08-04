"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlotRoutes = void 0;
// modules/astrologer/slot/slot.routes.ts
const express_1 = __importDefault(require("express"));
const slot_controller_1 = require("./slot.controller");
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const accounts_constants_1 = require("../../accounts/accounts.constants");
const router = express_1.default.Router();
//  Add slots (Astrologer only)
router.post('/add', (0, auth_1.default)(accounts_constants_1.UserRole.astrologer), slot_controller_1.SlotController.addSlots);
//  Get all slots (User & Astrologer)
router.get('/:astrologerId/:date', (0, auth_1.default)(accounts_constants_1.UserRole.user, accounts_constants_1.UserRole.astrologer), slot_controller_1.SlotController.getAllSlots);
exports.SlotRoutes = router;

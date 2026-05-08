"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressRoutes = void 0;
const express_1 = __importDefault(require("express"));
const address_controller_1 = require("./address.controller");
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const accounts_constants_1 = require("../../accounts/accounts.constants");
const router = express_1.default.Router();
router.use((0, auth_1.default)(accounts_constants_1.UserRole.user));
router.post("/add", address_controller_1.AddressControllers.addAddress);
router.get("/my", address_controller_1.AddressControllers.getMyAddresses);
router.get("/:addressId", address_controller_1.AddressControllers.getSingleAddress);
router.patch("/update/:addressId", address_controller_1.AddressControllers.updateAddress);
router.delete("/delete/:addressId", address_controller_1.AddressControllers.deleteAddress);
exports.AddressRoutes = router;

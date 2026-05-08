import express from "express";
import { AddressControllers } from "./address.controller";
import auth from "../../../middlewares/auth";
import { UserRole } from "../../accounts/accounts.constants";

const router = express.Router();

router.use(auth(UserRole.user));

router.post(
    "/add",
    AddressControllers.addAddress
);

router.get(
    "/my",
    AddressControllers.getMyAddresses
);

router.get(
    "/:addressId",
    AddressControllers.getSingleAddress
);

router.patch(
    "/update/:addressId",
    AddressControllers.updateAddress
);

router.delete(
    "/delete/:addressId",
    AddressControllers.deleteAddress
);

export const AddressRoutes = router;
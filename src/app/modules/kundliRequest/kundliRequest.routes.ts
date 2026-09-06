import express from "express";
import { KundliRequestControllers } from "./kundliRequest.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../accounts/accounts.constants";
import { multerUpload } from "../../config/multer.config";

const router = express.Router();

// Send Kundli Request (User)
router.post(
    "/",
    auth(UserRole.user),
    multerUpload.array("files", 5),
    KundliRequestControllers.sendKundliRequest
);

// Get My Kundli Requests (User)
router.get(
    "/all",
    auth(UserRole.admin),
    KundliRequestControllers.getAllKundliRequests
);

// Get My Kundli Requests (User)
router.get(
    "/my-requests",
    auth(UserRole.user),
    KundliRequestControllers.getMyKundliRequests
);

// Get Kundli Requests for Astrologer
router.get(
    "/astrologer-requests",
    auth(UserRole.astrologer),
    KundliRequestControllers.getAstrologerKundliRequests
);

// Accept Kundli Request
router.put(
    "/accept/requestId",
    auth(UserRole.astrologer),
    KundliRequestControllers.acceptRequest
);

// Reject Kundli Request
router.put(
    "/reject/requestId",
    auth(UserRole.astrologer),
    KundliRequestControllers.rejectRequest
);

router.get(
    "/:requestId",
    auth(UserRole.user, UserRole.astrologer, UserRole.admin),
    KundliRequestControllers.getSingleKundliRequestById
);



// Submit Kundli Report (Astrologer)
router.post(
    "/:requestId/submit-report",
    auth(UserRole.astrologer),
    multerUpload.single("file"),
    KundliRequestControllers.submitKundliReport
);

// Assign Kundli Request to Astrologer
router.put(
    "/assign-astrologer/:requestId",
    auth(UserRole.admin),
    KundliRequestControllers.assignAstrologer
);

export const KundliRequestRoutes = router;
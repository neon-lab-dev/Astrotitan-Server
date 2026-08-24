// modules/astrologer/slot/slot.routes.ts
import express from 'express';
import { SlotController } from './slot.controller';
import auth from '../../../middlewares/auth';
import { UserRole } from '../../accounts/accounts.constants';

const router = express.Router();

//  Add slots (Astrologer only)
router.post(
    '/add',
    auth(UserRole.astrologer),
    SlotController.addSlots
);

//  Get all slots (User & Astrologer)
router.get(
    '/my/:date',
    auth(UserRole.user, UserRole.admin, UserRole.astrologer),
    SlotController.getAllSlotsForAstrologer
);

//  Get all slots (User & Astrologer)
router.get(
    '/:astrologerId/:date',
    auth(UserRole.user, UserRole.astrologer),
    SlotController.getAllSlots
);

export const SlotRoutes = router;
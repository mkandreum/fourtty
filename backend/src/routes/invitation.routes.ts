import { Router } from 'express';
import {
    generateInvitation,
    getMyInvitations
} from '../controllers/invitation.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/generate', authenticateToken, generateInvitation);
router.get('/my', authenticateToken, getMyInvitations);

export default router;

import { Router } from 'express';
import {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriendRequests,
    getFriends,
    removeFriend
} from '../controllers/friendship.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/request', authenticateToken, sendFriendRequest);
router.put('/:id/accept', authenticateToken, acceptFriendRequest);
router.put('/:id/reject', authenticateToken, rejectFriendRequest);
router.get('/requests', authenticateToken, getFriendRequests);
router.get('/', authenticateToken, getFriends);
router.delete('/:id', authenticateToken, removeFriend);

export default router;

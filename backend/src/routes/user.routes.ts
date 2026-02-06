import { Router } from 'express';
import {
    getUserProfile,
    updateUserProfile,
    searchUsers,
    getUserFriends,
    uploadUserAvatar
} from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth';
import { checkPrivacy } from '../middleware/privacy';
import { uploadAvatar } from '../middleware/upload';

const router = Router();

router.get('/search', authenticateToken, searchUsers);
router.get('/:id', authenticateToken, checkPrivacy, getUserProfile);
router.put('/:id', authenticateToken, updateUserProfile);
router.post('/:id/avatar', authenticateToken, uploadAvatar, uploadUserAvatar);
router.get('/:id/friends', authenticateToken, checkPrivacy, getUserFriends);

export default router;

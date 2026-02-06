import { Router } from 'express';
import {
    createPage,
    followPage,
    unfollowPage,
    getPages,
    getPageDetails,
    createPagePost
} from '../controllers/page.controller';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', authenticateToken, getPages);
router.post('/', authenticateToken, upload.single('image'), createPage);
router.get('/:id', authenticateToken, getPageDetails);
router.post('/:id/follow', authenticateToken, followPage);
router.post('/:id/unfollow', authenticateToken, unfollowPage);
router.post('/:id/posts', authenticateToken, upload.single('image'), createPagePost);

export default router;

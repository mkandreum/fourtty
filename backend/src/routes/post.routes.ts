import { Router } from 'express';
import {
    getFeed,
    createPost,
    getPost,
    deletePost,
    getUserPosts
} from '../controllers/post.controller';
import { authenticateToken } from '../middleware/auth';
import { checkPrivacy } from '../middleware/privacy';
import { uploadPostImage } from '../middleware/upload';

const router = Router();

router.get('/feed', authenticateToken, getFeed);
router.post('/', authenticateToken, uploadPostImage, createPost);
router.get('/:id', authenticateToken, getPost);
router.delete('/:id', authenticateToken, deletePost);
router.get('/user/:userId', authenticateToken, checkPrivacy, getUserPosts);

export default router;

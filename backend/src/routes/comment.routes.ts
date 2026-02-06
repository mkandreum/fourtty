import { Router } from 'express';
import {
    getPostComments,
    getPhotoComments,
    createComment,
    deleteComment
} from '../controllers/comment.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/post/:postId', authenticateToken, getPostComments);
router.post('/post/:postId', authenticateToken, createComment);

router.get('/photo/:photoId', authenticateToken, getPhotoComments);
router.post('/photo/:photoId', authenticateToken, createComment);

router.delete('/:id', authenticateToken, deleteComment);

export default router;

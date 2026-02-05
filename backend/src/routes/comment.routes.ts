import { Router } from 'express';
import {
    getPostComments,
    createComment,
    deleteComment
} from '../controllers/comment.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/post/:postId', authenticateToken, getPostComments);
router.post('/post/:postId', authenticateToken, createComment);
router.delete('/:id', authenticateToken, deleteComment);

export default router;

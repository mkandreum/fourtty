import { Router } from 'express';
import {
    getConversations,
    getMessages,
    sendMessage,
    markAsRead
} from '../controllers/message.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/conversations', authenticateToken, getConversations);
router.get('/:userId', authenticateToken, getMessages);
router.post('/', authenticateToken, sendMessage);
router.put('/:id/read', authenticateToken, markAsRead);

export default router;

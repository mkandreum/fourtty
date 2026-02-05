import { Router } from 'express';
import {
    getNotifications,
    markAsRead,
    markAllAsRead
} from '../controllers/notification.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getNotifications);
router.put('/:id/read', authenticateToken, markAsRead);
router.put('/read-all', authenticateToken, markAllAsRead);

export default router;

import { Router } from 'express';
import { trackVisit, getProfileStats } from '../controllers/visit.controller';
import { uploadPhoto, getUserPhotos, tagPhoto } from '../controllers/photo.controller';
import { createEvent, getEvents, joinEvent } from '../controllers/event.controller';
import { authenticateToken } from '../middleware/auth';
import { uploadAvatar } from '../middleware/upload';

const router = Router();

// Stats & Visits
router.get('/stats', authenticateToken, getProfileStats);
router.post('/visit/:id', authenticateToken, trackVisit);

// Photos
router.post('/photos', authenticateToken, uploadAvatar, uploadPhoto);
router.get('/photos/user/:userId', authenticateToken, getUserPhotos);
router.post('/photos/:id/tag', authenticateToken, tagPhoto);

// Events
router.get('/events', authenticateToken, getEvents);
router.post('/events', authenticateToken, uploadAvatar, createEvent);
router.post('/events/:id/join', authenticateToken, joinEvent);

export default router;

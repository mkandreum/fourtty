import { Router } from 'express';
import { trackVisit, getProfileStats } from '../controllers/visit.controller';
import { togglePostLike, togglePhotoLike } from '../controllers/like.controller';
import { uploadPhoto, getUserPhotos, tagPhoto } from '../controllers/photo.controller';
import { createEvent, getEvents, joinEvent } from '../controllers/event.controller';
import { authenticateToken } from '../middleware/auth';
import { checkPrivacy } from '../middleware/privacy';
import { uploadAvatar, uploadPostImage } from '../middleware/upload';

const router = Router();

// Stats & Visits
router.get('/stats', authenticateToken, getProfileStats);
router.post('/visit/:id', authenticateToken, trackVisit);

// Likes
router.post('/posts/:id/like', authenticateToken, togglePostLike);
router.post('/photos/:id/like', authenticateToken, togglePhotoLike);

// Photos
router.post('/photos', authenticateToken, uploadPostImage, uploadPhoto);
router.get('/photos/user/:userId', authenticateToken, checkPrivacy, getUserPhotos);
router.post('/photos/:id/tag', authenticateToken, tagPhoto);

// Events
router.get('/events', authenticateToken, getEvents);
router.post('/events', authenticateToken, uploadPostImage, createEvent);
router.post('/events/:id/join', authenticateToken, joinEvent);

export default router;

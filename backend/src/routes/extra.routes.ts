import { Router } from 'express';
import { trackVisit, getProfileStats } from '../controllers/visit.controller';
import { togglePostLike, togglePhotoLike, toggleCommentLike } from '../controllers/like.controller';
import { uploadPhoto, getUserPhotos, tagPhoto, deletePhoto } from '../controllers/photo.controller';
import { createEvent, getEvents, joinEvent } from '../controllers/event.controller';
import { proxyAvatar } from '../controllers/avatar.controller';
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
router.post('/comments/:id/like', authenticateToken, toggleCommentLike);

// Photos
router.post('/photos', authenticateToken, uploadPostImage, uploadPhoto);
router.get('/photos/user/:userId', authenticateToken, checkPrivacy, getUserPhotos);
router.post('/photos/:id/tag', authenticateToken, tagPhoto);
router.delete('/photos/:id', authenticateToken, deletePhoto);

router.get('/events', authenticateToken, getEvents);
router.post('/events', authenticateToken, uploadPostImage, createEvent);
router.post('/events/:id/join', authenticateToken, joinEvent);

// Proxy
router.get('/proxy/avatar', proxyAvatar); // No auth needed for public avatars

export default router;

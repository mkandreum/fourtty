import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

// Upload a photo to gallery
export const uploadPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;

        if (!req.file) {
            res.status(400).json({ error: 'No image uploaded' });
            return;
        }

        const photoUrl = `/uploads/${req.file.filename}`;
        const { caption } = req.body;

        const photo = await prisma.photo.create({
            data: {
                userId,
                url: photoUrl,
                caption
            }
        });

        res.status(201).json({ photo });
    } catch (error) {
        console.error('Upload photo error:', error);
        res.status(500).json({ error: 'Failed to upload photo' });
    }
};

// Get user photos
export const getUserPhotos = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.userId as string);

        const photos = await prisma.photo.findMany({
            where: { userId },
            include: {
                photoTags: {
                    include: {
                        user: {
                            select: { id: true, name: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ photos });
    } catch (error) {
        console.error('Get user photos error:', error);
        res.status(500).json({ error: 'Failed to get photos' });
    }
};

// Add tag to photo
export const tagPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const photoId = parseInt(req.params.id);
        const { userId, x, y } = req.body;

        const tag = await prisma.photoTag.create({
            data: {
                photoId,
                userId,
                x,
                y
            },
            include: {
                user: { select: { name: true } }
            }
        });

        // Get current user name for notification
        const currentUser = await prisma.user.findUnique({ where: { id: req.userId! }, select: { name: true } });
        const senderName = currentUser?.name || 'Un amigo';

        // Notify tagged user
        await prisma.notification.create({
            data: {
                userId,
                type: 'tag',
                content: `${senderName} te ha etiquetado en una foto`,
                relatedId: photoId,
                relatedUserId: req.userId!
            }
        });

        res.status(201).json({ tag });
    } catch (error) {
        console.error('Tag photo error:', error);
        res.status(500).json({ error: 'Failed to tag photo' });
    }
};

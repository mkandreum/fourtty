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
            orderBy: { createdAt: 'desc' }
        });

        res.json({ photos });
    } catch (error) {
        console.error('Get user photos error:', error);
        res.status(500).json({ error: 'Failed to get photos' });
    }
};

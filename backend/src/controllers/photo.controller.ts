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
        const { caption, tags, initialComment } = req.body;

        const photo = await prisma.photo.create({
            data: {
                userId,
                url: photoUrl,
                caption
            },
            include: {
                user: { select: { name: true } }
            }
        });

        // Add tags if provided
        if (tags && Array.isArray(JSON.parse(tags))) {
            const parsedTags = JSON.parse(tags);
            for (const taggedUid of parsedTags) {
                await prisma.photoTag.create({
                    data: {
                        photoId: photo.id,
                        userId: parseInt(taggedUid)
                    }
                });

                // Notify tagged user
                await prisma.notification.create({
                    data: {
                        userId: parseInt(taggedUid),
                        type: 'tag',
                        content: `${photo.user.name} te ha etiquetado en una foto`,
                        relatedId: photo.id,
                        relatedUserId: userId
                    }
                });
            }
        }

        // Add initial comment if provided
        if (initialComment && initialComment.trim()) {
            await prisma.comment.create({
                data: {
                    photoId: photo.id,
                    userId,
                    content: initialComment
                }
            });
        }

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
                },
                _count: {
                    select: {
                        likes: true
                    }
                },
                likes: {
                    where: { userId: (req as any).userId },
                    select: { id: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            photos: photos.map(p => ({
                ...p,
                likedByMe: p.likes.length > 0
            }))
        });
    } catch (error) {
        console.error('Get user photos error:', error);
        res.status(500).json({ error: 'Failed to get photos' });
    }
};

// Add tag to photo
export const tagPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const photoId = parseInt(req.params.id as string);
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

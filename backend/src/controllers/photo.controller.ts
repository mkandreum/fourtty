import { Response } from 'express';
import { prisma, io } from '../index';
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
                const notification = await prisma.notification.create({
                    data: {
                        userId: parseInt(taggedUid),
                        type: 'tag_photo',
                        content: `${photo.user.name} te ha etiquetado en una foto`,
                        relatedId: photo.id,
                        relatedUserId: userId
                    }
                });
                // Emit real-time notification
                io.to(`user_${parseInt(taggedUid)}`).emit('notification', notification);
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

        // --- NEW: Create a POST for this photo so it appears in the feed ---
        // --- NEW: Create a POST for this photo so it appears in the feed ---
        const post = await prisma.post.create({
            data: {
                userId,
                content: caption || 'compartió una foto',
                type: 'photo',
                image: photoUrl // Use the same photo URL
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                },
                _count: {
                    select: {
                        comments: true,
                        likes: true
                    }
                },
                likes: {
                    where: { userId: req.userId! },
                    select: { id: true }
                }
            }
        });

        res.status(201).json({ photo, post: { ...post, likedByMe: false } });
    } catch (error: any) {
        console.error('Upload photo error:', error);
        res.status(500).json({
            error: 'Failed to upload photo',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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
        const { userId: taggedUserId, x, y } = req.body;

        // Check if current user has permission to tag this photo
        const photo = await prisma.photo.findUnique({
            where: { id: photoId },
            select: { userId: true }
        });

        if (!photo) {
            res.status(404).json({ error: 'Photo not found' });
            return;
        }

        // Only owner or owner's friend can tag
        if (photo.userId !== req.userId) {
            const friendship = await prisma.friendship.findFirst({
                where: {
                    OR: [
                        { userId: req.userId!, friendId: photo.userId, status: 'accepted' },
                        { userId: photo.userId, friendId: req.userId!, status: 'accepted' }
                    ]
                }
            });

            if (!friendship) {
                res.status(403).json({ error: 'Only the owner or their friends can tag this photo' });
                return;
            }
        }

        const tag = await prisma.photoTag.create({
            data: {
                photoId,
                userId: taggedUserId,
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
        const notification = await prisma.notification.create({
            data: {
                userId: taggedUserId,
                type: 'tag_photo',
                content: `${senderName} te ha etiquetado en una foto`,
                relatedId: photoId,
                relatedUserId: req.userId!
            }
        });
        // Emit real-time notification
        io.to(`user_${taggedUserId}`).emit('notification', notification);

        res.status(201).json({ tag });
    } catch (error) {
        console.error('Tag photo error:', error);
        res.status(500).json({ error: 'Failed to tag photo' });
    }
};

// Delete photo from gallery
export const deletePhoto = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const photoId = parseInt(req.params.id as string);

        const photo = await prisma.photo.findUnique({
            where: { id: photoId }
        });

        if (!photo) {
            res.status(404).json({ error: 'Photo not found' });
            return;
        }

        if (photo.userId !== req.userId) {
            res.status(403).json({ error: 'You can only delete your own photos' });
            return;
        }

        await prisma.photo.delete({
            where: { id: photoId }
        });

        res.json({ message: 'Photo deleted successfully' });
    } catch (error) {
        console.error('Delete photo error:', error);
        res.status(500).json({ error: 'Failed to delete photo' });
    }
};

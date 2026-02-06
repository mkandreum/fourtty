import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

// Toggle like on a post
export const togglePostLike = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const postId = parseInt(req.params.id as string);

        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            }
        });

        if (existingLike) {
            await prisma.like.delete({ where: { id: existingLike.id } });
            res.json({ liked: false });
        } else {
            await prisma.like.create({
                data: { userId, postId }
            });

            // Notify post owner
            const post = await prisma.post.findUnique({
                where: { id: postId },
                include: { user: { select: { name: true } } }
            });

            if (post && post.userId !== userId) {
                const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
                await prisma.notification.create({
                    data: {
                        userId: post.userId,
                        type: 'like',
                        content: `${currentUser?.name} le mola tu publicación`,
                        relatedId: postId,
                        relatedUserId: userId
                    }
                });
            }

            res.status(201).json({ liked: true });
        }
    } catch (error) {
        console.error('Toggle post like error:', error);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
};

// Toggle like on a photo
export const togglePhotoLike = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const photoId = parseInt(req.params.id as string);

        const existingLike = await prisma.like.findUnique({
            where: {
                userId_photoId: {
                    userId,
                    photoId
                }
            }
        });

        if (existingLike) {
            await prisma.like.delete({ where: { id: existingLike.id } });
            res.json({ liked: false });
        } else {
            await prisma.like.create({
                data: { userId, photoId }
            });

            // Notify photo owner
            const photo = await prisma.photo.findUnique({
                where: { id: photoId },
                include: { user: { select: { name: true } } }
            });

            if (photo && photo.userId !== userId) {
                const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
                await prisma.notification.create({
                    data: {
                        userId: photo.userId,
                        type: 'like',
                        content: `${currentUser?.name} le mola tu foto`,
                        relatedId: photoId,
                        relatedUserId: userId
                    }
                });
            }

            res.status(201).json({ liked: true });
        }
    } catch (error) {
        console.error('Toggle photo like error:', error);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
};

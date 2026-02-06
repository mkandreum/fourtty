import { Response } from 'express';
import { prisma, io } from '../index';
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
                const notification = await prisma.notification.create({
                    data: {
                        userId: post.userId,
                        type: 'like',
                        content: `${currentUser?.name} le mola tu publicación`,
                        relatedId: postId,
                        relatedUserId: userId
                    }
                });

                // Emit real-time notification
                io.to(`user_${post.userId}`).emit('notification', notification);
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
                const notification = await prisma.notification.create({
                    data: {
                        userId: photo.userId,
                        type: 'like',
                        content: `${currentUser?.name} le mola tu foto`,
                        relatedId: photoId,
                        relatedUserId: userId
                    }
                });

                // Emit real-time notification
                io.to(`user_${photo.userId}`).emit('notification', notification);
            }

            res.status(201).json({ liked: true });
        }
    } catch (error) {
        console.error('Toggle photo like error:', error);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
};

// Toggle like on a comment
export const toggleCommentLike = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const commentId = parseInt(req.params.id as string);

        const existingLike = await prisma.like.findUnique({
            where: {
                userId_commentId: {
                    userId,
                    commentId
                }
            }
        });

        if (existingLike) {
            await prisma.like.delete({ where: { id: existingLike.id } });
            res.json({ liked: false });
        } else {
            await prisma.like.create({
                data: { userId, commentId }
            });

            // Notify comment owner
            const comment = await prisma.comment.findUnique({
                where: { id: commentId },
                include: { user: { select: { id: true, name: true } } }
            });

            if (comment && comment.userId !== userId) {
                const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
                const notification = await prisma.notification.create({
                    data: {
                        userId: comment.userId,
                        type: 'like',
                        content: `${currentUser?.name} le mola tu comentario`,
                        relatedId: comment.postId || comment.photoId || commentId,
                        relatedUserId: userId
                    }
                });

                // Emit real-time notification
                io.to(`user_${comment.userId}`).emit('notification', notification);
            }

            res.status(201).json({ liked: true });
        }
    } catch (error) {
        console.error('Toggle comment like error:', error);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
};

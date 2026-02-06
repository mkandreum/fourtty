import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

// Get comments for a post
export const getPostComments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const postId = parseInt(req.params.postId as string);

        const comments = await prisma.comment.findMany({
            where: { postId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        res.json({ comments });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Failed to get comments' });
    }
};

// Get comments for a photo
export const getPhotoComments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const photoId = parseInt(req.params.photoId as string);

        const comments = await prisma.comment.findMany({
            where: { photoId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        res.json({ comments });
    } catch (error) {
        console.error('Get photo comments error:', error);
        res.status(500).json({ error: 'Failed to get comments' });
    }
};

// Create comment
export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { postId, photoId } = req.params;
        const { content } = req.body;
        const userId = req.userId!;

        if (!content || !content.trim()) {
            res.status(400).json({ error: 'Content is required' });
            return;
        }

        if (postId) {
            const pid = parseInt(postId as string);
            const post = await prisma.post.findUnique({ where: { id: pid } });
            if (!post) {
                res.status(404).json({ error: 'Post not found' });
                return;
            }

            const comment = await prisma.comment.create({
                data: { postId: pid, userId, content },
                include: { user: { select: { id: true, name: true, avatar: true } } }
            });

            if (post.userId !== userId) {
                await prisma.notification.create({
                    data: {
                        userId: post.userId,
                        type: 'comment',
                        content: `${comment.user.name} ha comentado en tu publicación`,
                        relatedId: pid,
                        relatedUserId: userId
                    }
                });
            }
            res.status(201).json({ message: 'Comment created successfully', comment });

        } else if (photoId) {
            const phid = parseInt(photoId as string);
            const photo = await prisma.photo.findUnique({ where: { id: phid } });
            if (!photo) {
                res.status(404).json({ error: 'Photo not found' });
                return;
            }

            const comment = await prisma.comment.create({
                data: { photoId: phid, userId, content },
                include: { user: { select: { id: true, name: true, avatar: true } } }
            });

            if (photo.userId !== userId) {
                await prisma.notification.create({
                    data: {
                        userId: photo.userId,
                        type: 'comment',
                        content: `${comment.user.name} ha comentado en tu foto`,
                        relatedId: phid,
                        relatedUserId: userId
                    }
                });
            }
            res.status(201).json({ message: 'Comment created successfully', comment });
        } else {
            res.status(400).json({ error: 'Target ID is required' });
        }

    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
};

// Delete comment
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const commentId = parseInt(req.params.id as string);

        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            res.status(404).json({ error: 'Comment not found' });
            return;
        }

        if (comment.userId !== req.userId) {
            res.status(403).json({ error: 'You can only delete your own comments' });
            return;
        }

        await prisma.comment.delete({
            where: { id: commentId }
        });

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
};

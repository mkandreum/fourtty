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

// Create comment
export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const postId = parseInt(req.params.postId as string);
        const { content } = req.body;

        if (!content || !content.trim()) {
            res.status(400).json({ error: 'Content is required' });
            return;
        }

        // Check if post exists
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { user: true }
        });

        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }

        const comment = await prisma.comment.create({
            data: {
                postId,
                userId: req.userId!,
                content
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            }
        });

        // Create notification for post author (if not commenting on own post)
        if (post.userId !== req.userId) {
            await prisma.notification.create({
                data: {
                    userId: post.userId,
                    type: 'comment',
                    content: `${comment.user.name} ha comentado en tu publicación`,
                    relatedId: postId,
                    relatedUserId: req.userId!
                }
            });
        }

        res.status(201).json({
            message: 'Comment created successfully',
            comment
        });
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

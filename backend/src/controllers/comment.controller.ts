import { Response } from 'express';
import { prisma, io } from '../index';
import { AuthRequest } from '../middleware/auth';

// Get comments for a post
export const getPostComments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const postId = parseInt(req.params.postId as string);
        const userId = req.userId;

        const comments = await prisma.comment.findMany({
            where: { postId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                },
                _count: {
                    select: { likes: true }
                },
                likes: userId ? {
                    where: { userId }
                } : false
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        const formattedComments = comments.map(c => ({
            ...c,
            likeCount: c._count.likes,
            isLiked: c.likes?.length > 0
        }));

        res.json({ comments: formattedComments });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Failed to get comments' });
    }
};

// Get comments for a photo
export const getPhotoComments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const photoId = parseInt(req.params.photoId as string);
        const userId = req.userId;

        const comments = await prisma.comment.findMany({
            where: { photoId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                },
                _count: {
                    select: { likes: true }
                },
                likes: userId ? {
                    where: { userId }
                } : false
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        const formattedComments = comments.map(c => ({
            ...c,
            likeCount: c._count.likes,
            isLiked: c.likes?.length > 0
        }));

        res.json({ comments: formattedComments });
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

        const commentData: any = { userId, content };
        let targetId: number | null = null;
        let targetType: 'post' | 'photo' | null = null;

        if (postId) {
            targetId = parseInt(postId as string);
            commentData.postId = targetId;
            targetType = 'post';
        } else if (photoId) {
            targetId = parseInt(photoId as string);
            commentData.photoId = targetId;
            targetType = 'photo';
        }

        if (!targetId) {
            res.status(400).json({ error: 'Target ID is required' });
            return;
        }

        const comment = await prisma.comment.create({
            data: commentData,
            include: { user: { select: { id: true, name: true, avatar: true } } }
        });

        // Notify content owner
        const notifyOwner = async () => {
            if (targetType === 'post') {
                const post = await prisma.post.findUnique({ where: { id: targetId! } });
                if (post && post.userId !== userId) {
                    const notification = await prisma.notification.create({
                        data: {
                            userId: post.userId,
                            type: 'comment',
                            content: `${comment.user.name} ha comentado en tu publicación`,
                            relatedId: targetId!,
                            relatedUserId: userId
                        }
                    });
                    // Emit real-time notification
                    io.to(`user_${post.userId}`).emit('notification', notification);
                }
            } else {
                const photo = await prisma.photo.findUnique({ where: { id: targetId! } });
                if (photo && photo.userId !== userId) {
                    const notification = await prisma.notification.create({
                        data: {
                            userId: photo.userId,
                            type: 'comment',
                            content: `${comment.user.name} ha comentado en tu foto`,
                            relatedId: targetId!,
                            relatedUserId: userId
                        }
                    });
                    // Emit real-time notification
                    io.to(`user_${photo.userId}`).emit('notification', notification);
                }
            }
        };
        await notifyOwner();

        // Parse mentions (@Name)
        const mentions = content.match(/@([\w\sáéíóúÁÉÍÓÚñÑ]+)/g);
        if (mentions) {
            // Get friends to verify mentions
            const userFriends = await prisma.friendship.findMany({
                where: {
                    OR: [
                        { userId, status: 'accepted' },
                        { friendId: userId, status: 'accepted' }
                    ]
                },
                include: {
                    user: true,
                    friend: true
                }
            });

            const friends = userFriends.map(f => f.userId === userId ? f.friend : f.user);

            for (const mention of mentions) {
                const nameMentioned = mention.substring(1).trim();
                const matchedFriend = friends.find(f => f.name.toLowerCase() === nameMentioned.toLowerCase());

                if (matchedFriend && matchedFriend.id !== userId) {
                    const notification = await prisma.notification.create({
                        data: {
                            userId: matchedFriend.id,
                            type: 'tag',
                            content: `${comment.user.name} te ha mencionado en un comentario`,
                            relatedId: targetId!,
                            relatedUserId: userId
                        }
                    });
                    // Emit real-time notification
                    io.to(`user_${matchedFriend.id}`).emit('notification', notification);
                }
            }
        }

        res.status(201).json({
            message: 'Comment created successfully',
            comment: { ...comment, likeCount: 0, isLiked: false }
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

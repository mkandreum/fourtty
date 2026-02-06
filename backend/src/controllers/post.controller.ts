import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

// Get feed (posts from friends and own posts)
export const getFeed = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        // Get user's friends
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { userId: req.userId!, status: 'accepted' },
                    { friendId: req.userId!, status: 'accepted' }
                ]
            }
        });

        // Extract friend IDs
        const friendIds = friendships.map(f =>
            f.userId === req.userId ? f.friendId : f.userId
        );

        // Include own posts and friends' posts
        const userIds = [req.userId!, ...friendIds];

        const posts = await prisma.post.findMany({
            where: {
                userId: {
                    in: userIds
                }
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
                        comments: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limit
        });

        const total = await prisma.post.count({
            where: {
                userId: {
                    in: userIds
                }
            }
        });

        res.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get feed error:', error);
        res.status(500).json({ error: 'Failed to get feed' });
    }
};

// Create post
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { content, type, videoUrl } = req.body;

        if (!content && !videoUrl && !req.file) {
            res.status(400).json({ error: 'Content, image or video is required' });
            return;
        }

        const postType = type || (videoUrl ? 'video' : (req.file ? 'photo' : 'status'));
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const post = await prisma.post.create({
            data: {
                userId: req.userId!,
                content: content || (videoUrl ? 'compartió un vídeo' : (req.file ? 'compartió una foto' : '')),
                type: postType,
                image: imageUrl,
                videoUrl: videoUrl
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
                        comments: true
                    }
                }
            }
        });

        // Create notifications for friends
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { userId: req.userId!, status: 'accepted' },
                    { friendId: req.userId!, status: 'accepted' }
                ]
            }
        });

        const friendIds = friendships.map(f =>
            f.userId === req.userId ? f.friendId : f.userId
        );

        if (friendIds.length > 0) {
            // Get current user name for notification
            const currentUser = await prisma.user.findUnique({ where: { id: req.userId! }, select: { name: true } });
            const senderName = currentUser?.name || 'Un amigo';

            await prisma.notification.createMany({
                data: friendIds.map(friendId => ({
                    userId: friendId,
                    type: postType === 'photo' ? 'photo' : postType === 'video' ? 'video' : 'status',
                    content: `${senderName} ha publicado ${postType === 'photo' ? 'una foto' : postType === 'video' ? 'un vídeo' : 'un estado'}`,
                    relatedId: post.id,
                    relatedUserId: req.userId!
                }))
            });
        }

        res.status(201).json({
            message: 'Post created successfully',
            post
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
};

// Get single post
export const getPost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const postId = parseInt(req.params.id as string);

        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                },
                comments: {
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
                },
                _count: {
                    select: {
                        comments: true
                    }
                }
            }
        });

        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }

        res.json({ post });
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ error: 'Failed to get post' });
    }
};

// Delete post
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const postId = parseInt(req.params.id as string);

        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }

        if (post.userId !== req.userId) {
            res.status(403).json({ error: 'You can only delete your own posts' });
            return;
        }

        await prisma.post.delete({
            where: { id: postId }
        });

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
};

// Get user posts
export const getUserPosts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.userId as string);
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const posts = await prisma.post.findMany({
            where: { userId },
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
                        comments: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limit
        });

        const total = await prisma.post.count({
            where: { userId }
        });

        res.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({ error: 'Failed to get user posts' });
    }
};

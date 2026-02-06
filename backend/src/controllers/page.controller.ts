import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

// Create a new page
export const createPage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, description, category } = req.body;
        const creatorId = req.userId!;

        if (!name) {
            res.status(400).json({ error: 'Page name is required' });
            return;
        }

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const page = await prisma.page.create({
            data: {
                name,
                description,
                category,
                image: imageUrl,
                creatorId
            }
        });

        // Creator automatically follows the page
        await prisma.pageFollower.create({
            data: {
                pageId: page.id,
                userId: creatorId
            }
        });

        res.status(201).json({ page });
    } catch (error) {
        console.error('Create page error:', error);
        res.status(500).json({ error: 'Failed to create page' });
    }
};

// Follow a page
export const followPage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const pageId = parseInt(req.params.id);

        const follow = await prisma.pageFollower.upsert({
            where: {
                pageId_userId: { pageId, userId }
            },
            update: {},
            create: {
                pageId,
                userId
            }
        });

        res.json({ message: 'Following page', follow });
    } catch (error) {
        console.error('Follow page error:', error);
        res.status(500).json({ error: 'Failed to follow page' });
    }
};

// Unfollow a page
export const unfollowPage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;
        const pageId = parseInt(req.params.id);

        await prisma.pageFollower.delete({
            where: {
                pageId_userId: { pageId, userId }
            }
        });

        res.json({ message: 'Unfollowed page' });
    } catch (error) {
        console.error('Unfollow page error:', error);
        res.status(500).json({ error: 'Failed to unfollow page' });
    }
};

// Get all pages
export const getPages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const pages = await prisma.page.findMany({
            include: {
                _count: {
                    select: { followers: true }
                }
            }
        });
        res.json({ pages });
    } catch (error) {
        console.error('Get pages error:', error);
        res.status(500).json({ error: 'Failed to get pages' });
    }
};

// Get single page with posts
export const getPageDetails = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const pageId = parseInt(req.params.id);

        const page = await prisma.page.findUnique({
            where: { id: pageId },
            include: {
                posts: {
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: { followers: true }
                }
            }
        });

        if (!page) {
            res.status(404).json({ error: 'Page not found' });
            return;
        }

        // Check if current user follows
        const isFollowing = await prisma.pageFollower.findUnique({
            where: {
                pageId_userId: {
                    pageId,
                    userId: req.userId!
                }
            }
        });

        res.json({ page, isFollowing: !!isFollowing });
    } catch (error) {
        console.error('Get page details error:', error);
        res.status(500).json({ error: 'Failed to get page details' });
    }
};

// Create a post for a page (only creator)
export const createPagePost = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const pageId = parseInt(req.params.id);
        const { content, videoUrl } = req.body;
        const userId = req.userId!;

        const page = await prisma.page.findUnique({
            where: { id: pageId }
        });

        if (!page || page.creatorId !== userId) {
            res.status(403).json({ error: 'Only the creator can post to this page' });
            return;
        }

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const post = await prisma.pagePost.create({
            data: {
                pageId,
                content,
                image: imageUrl,
                videoUrl
            }
        });

        res.status(201).json({ post });
    } catch (error) {
        console.error('Create page post error:', error);
        res.status(500).json({ error: 'Failed to create page post' });
    }
};

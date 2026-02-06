import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

// Get user profile
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id as string);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                bio: true,
                gender: true,
                age: true,
                relationshipStatus: true,
                location: true,
                occupation: true,
                privacy: true,
                createdAt: true,
                _count: {
                    select: {
                        friendships: {
                            where: { status: 'accepted' }
                        },
                        posts: true,
                        photos: true
                    }
                }
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
};

// Update user profile
export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id as string);

        // Check if user can update this profile
        if (req.userId !== userId) {
            res.status(403).json({ error: 'You can only update your own profile' });
            return;
        }

        const { name, bio, gender, age, relationshipStatus, location, occupation, privacy } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name && { name }),
                ...(bio !== undefined && { bio }),
                ...(gender && { gender }),
                ...(age && { age: parseInt(age) }),
                ...(relationshipStatus && { relationshipStatus }),
                ...(location !== undefined && { location }),
                ...(occupation !== undefined && { occupation }),
                ...(privacy && { privacy })
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                bio: true,
                gender: true,
                age: true,
                relationshipStatus: true,
                location: true,
                occupation: true,
                privacy: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Upload user avatar
export const uploadUserAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id as string);

        // Check if user can update this profile
        if (req.userId !== userId) {
            res.status(403).json({ error: 'You can only update your own avatar' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const avatarUrl = `/uploads/${req.file.filename}`;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarUrl },
            select: {
                id: true,
                name: true,
                avatar: true
            }
        });

        res.json({
            message: 'Avatar uploaded successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
};

// Search users
export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const query = req.query.q as string;

        if (!query || query.trim().length < 2) {
            res.status(400).json({ error: 'Search query must be at least 2 characters' });
            return;
        }

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { email: { contains: query } }
                ],
                NOT: {
                    id: req.userId
                }
            },
            select: {
                id: true,
                name: true,
                avatar: true,
                location: true,
                occupation: true
            },
            take: 20
        });

        res.json({ users });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
};

// Get user friends
export const getUserFriends = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id as string);

        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { userId: userId, status: 'accepted' },
                    { friendId: userId, status: 'accepted' }
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        location: true,
                        bio: true
                    }
                },
                friend: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        location: true,
                        bio: true
                    }
                }
            }
        });

        // Map to get the friend user object (not the requesting user)
        const friends = friendships.map((f: any) => {
            return f.userId === userId ? f.friend : f.user;
        });

        res.json({ friends });
    } catch (error) {
        console.error('Get user friends error:', error);
        res.status(500).json({ error: 'Failed to get friends' });
    }
};

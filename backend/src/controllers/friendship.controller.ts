import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

// Send friend request
export const sendFriendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { friendId } = req.body;

        if (!friendId) {
            res.status(400).json({ error: 'Friend ID is required' });
            return;
        }

        if (friendId === req.userId) {
            res.status(400).json({ error: 'You cannot send a friend request to yourself' });
            return;
        }

        // Check if friendship already exists
        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId: req.userId!, friendId: friendId },
                    { userId: friendId, friendId: req.userId! }
                ]
            }
        });

        if (existing) {
            res.status(409).json({ error: 'Friend request already exists or you are already friends' });
            return;
        }

        const friendship = await prisma.friendship.create({
            data: {
                userId: req.userId!,
                friendId: friendId,
                status: 'pending'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                },
                friend: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            }
        });

        // Create notification for the friend
        await prisma.notification.create({
            data: {
                userId: friendId,
                type: 'friendship',
                content: `${friendship.user.name} te ha enviado una solicitud de amistad`,
                relatedId: friendship.id,
                relatedUserId: req.userId!
            }
        });

        res.status(201).json({
            message: 'Friend request sent successfully',
            friendship
        });
    } catch (error) {
        console.error('Send friend request error:', error);
        res.status(500).json({ error: 'Failed to send friend request' });
    }
};

// Accept friend request
export const acceptFriendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const friendshipId = parseInt(req.params.id as string);

        const friendship = await prisma.friendship.findUnique({
            where: { id: friendshipId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!friendship) {
            res.status(404).json({ error: 'Friend request not found' });
            return;
        }

        if (friendship.friendId !== req.userId) {
            res.status(403).json({ error: 'You can only accept requests sent to you' });
            return;
        }

        if (friendship.status !== 'pending') {
            res.status(400).json({ error: 'This request has already been processed' });
            return;
        }

        const updatedFriendship = await prisma.friendship.update({
            where: { id: friendshipId },
            data: { status: 'accepted' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                },
                friend: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            }
        });

        // Create notification for the requester
        await prisma.notification.create({
            data: {
                userId: friendship.userId,
                type: 'friendship',
                content: `${updatedFriendship.friend.name} ha aceptado tu solicitud de amistad`,
                relatedId: friendshipId,
                relatedUserId: req.userId!
            }
        });

        res.json({
            message: 'Friend request accepted',
            friendship: updatedFriendship
        });
    } catch (error) {
        console.error('Accept friend request error:', error);
        res.status(500).json({ error: 'Failed to accept friend request' });
    }
};

// Reject friend request
export const rejectFriendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const friendshipId = parseInt(req.params.id as string);

        const friendship = await prisma.friendship.findUnique({
            where: { id: friendshipId }
        });

        if (!friendship) {
            res.status(404).json({ error: 'Friend request not found' });
            return;
        }

        if (friendship.friendId !== req.userId) {
            res.status(403).json({ error: 'You can only reject requests sent to you' });
            return;
        }

        await prisma.friendship.update({
            where: { id: friendshipId },
            data: { status: 'rejected' }
        });

        res.json({ message: 'Friend request rejected' });
    } catch (error) {
        console.error('Reject friend request error:', error);
        res.status(500).json({ error: 'Failed to reject friend request' });
    }
};

// Get pending friend requests
export const getFriendRequests = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const requests = await prisma.friendship.findMany({
            where: {
                friendId: req.userId!,
                status: 'pending'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        location: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({ requests });
    } catch (error) {
        console.error('Get friend requests error:', error);
        res.status(500).json({ error: 'Failed to get friend requests' });
    }
};

// Get friends
export const getFriends = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { userId: req.userId!, status: 'accepted' },
                    { friendId: req.userId!, status: 'accepted' }
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

        const friends = friendships.map(f =>
            f.userId === req.userId ? f.friend : f.user
        );

        res.json({ friends });
    } catch (error) {
        console.error('Get friends error:', error);
        res.status(500).json({ error: 'Failed to get friends' });
    }
};

// Remove friend
export const removeFriend = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const friendshipId = parseInt(req.params.id as string);

        const friendship = await prisma.friendship.findUnique({
            where: { id: friendshipId }
        });

        if (!friendship) {
            res.status(404).json({ error: 'Friendship not found' });
            return;
        }

        if (friendship.userId !== req.userId && friendship.friendId !== req.userId) {
            res.status(403).json({ error: 'You can only remove your own friendships' });
            return;
        }

        await prisma.friendship.delete({
            where: { id: friendshipId }
        });

        res.json({ message: 'Friend removed successfully' });
    } catch (error) {
        console.error('Remove friend error:', error);
        res.status(500).json({ error: 'Failed to remove friend' });
    }
};
// Check friendship status
export const checkFriendshipStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const targetUserId = parseInt(req.params.userId as string);

        if (targetUserId === req.userId) {
            res.json({ status: 'self' });
            return;
        }

        const friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId: req.userId!, friendId: targetUserId },
                    { userId: targetUserId, friendId: req.userId! }
                ]
            }
        });

        if (!friendship) {
            res.json({ status: 'none' });
            return;
        }

        if (friendship.status === 'accepted') {
            res.json({ status: 'accepted', friendshipId: friendship.id });
            return;
        }

        if (friendship.status === 'pending') {
            // Check who sent it
            if (friendship.userId === req.userId) {
                res.json({ status: 'pending_sent', friendshipId: friendship.id });
            } else {
                res.json({ status: 'pending_received', friendshipId: friendship.id });
            }
            return;
        }

        res.json({ status: 'none' });

    } catch (error) {
        console.error('Check friendship status error:', error);
        res.status(500).json({ error: 'Failed to check friendship status' });
    }
};

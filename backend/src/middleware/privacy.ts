import { Response, NextFunction } from 'express';
import { prisma } from '../index';
import { AuthRequest } from './auth';

export const checkPrivacy = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const idParam = req.params.userId || req.params.id;
        const targetUserId = idParam ? parseInt(idParam as string) : NaN;
        const currentUserId = req.userId;

        if (!targetUserId) {
            return next();
        }

        // Owner always has access
        if (currentUserId === targetUserId) {
            return next();
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { privacy: true }
        });

        if (!targetUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const privacy = targetUser.privacy || 'public';

        if (privacy === 'public') {
            return next();
        }

        if (privacy === 'private') {
            res.status(403).json({ error: 'This profile is private' });
            return;
        }

        if (privacy === 'friends') {
            if (!currentUserId) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }

            const friendship = await prisma.friendship.findFirst({
                where: {
                    OR: [
                        { userId: currentUserId, friendId: targetUserId, status: 'accepted' },
                        { userId: targetUserId, friendId: currentUserId, status: 'accepted' }
                    ]
                }
            });

            if (!friendship) {
                res.status(403).json({ error: 'You must be friends to view this content' });
                return;
            }

            return next();
        }

        next();
    } catch (error) {
        console.error('Privacy middleware error:', error);
        res.status(500).json({ error: 'Internal server error checking privacy' });
    }
};

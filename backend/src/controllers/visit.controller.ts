import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

// Track a visit
export const trackVisit = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const visitorId = req.userId!;
        const targetId = parseInt(req.params.id as string);

        if (visitorId === targetId) {
            res.status(200).json({ message: 'Self visit' });
            return;
        }

        // Create visit
        await prisma.visit.create({
            data: {
                visitorId,
                targetId
            }
        });

        res.status(201).json({ message: 'Visit tracked' });
    } catch (error) {
        console.error('Track visit error:', error);
        res.status(500).json({ error: 'Failed to track visit' });
    }
};

// Get profile stats (real visits, friends, requests etc)
export const getProfileStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;

        const [visitsCount, requestsCount, friendsCount] = await Promise.all([
            prisma.visit.count({ where: { targetId: userId } }),
            prisma.friendship.count({ where: { friendId: userId, status: 'pending' } }),
            prisma.friendship.count({
                where: {
                    OR: [
                        { userId: userId, status: 'accepted' },
                        { friendId: userId, status: 'accepted' }
                    ]
                }
            })
        ]);

        res.json({
            visits: visitsCount,
            requests: requestsCount,
            friends: friendsCount
        });
    } catch (error) {
        console.error('Get profile stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
};
// Get recent visitors (last 12 unique)
export const getRecentVisitors = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId!;

        // Get visits to this user, unique by visitorId, ordered by latest
        // Prisma doesn't support distinct by column plus order by another column easily in some versions 
        // with sqlite, so we'll fetch more and filter in JS or use a Raw query if needed.
        // For simple cases and small lists, fetching top 50 and filtering unique is efficient enough.
        const visits = await prisma.visit.findMany({
            where: { targetId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                visitor: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        lastName: true
                    }
                }
            },
            take: 50
        });

        // Filter unique visitors
        const uniqueVisitorsMap = new Map();
        visits.forEach(v => {
            if (!uniqueVisitorsMap.has(v.visitorId)) {
                uniqueVisitorsMap.set(v.visitorId, v.visitor);
            }
        });

        const recentVisitors = Array.from(uniqueVisitorsMap.values()).slice(0, 12);

        res.json({ visitors: recentVisitors });
    } catch (error) {
        console.error('Get recent visitors error:', error);
        res.status(500).json({ error: 'Failed to get recent visitors' });
    }
};

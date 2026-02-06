import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

// Get notifications
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const notifications = await prisma.notification.findMany({
            where: {
                userId: req.userId!
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });

        const unreadCount = await prisma.notification.count({
            where: {
                userId: req.userId!,
                read: false
            }
        });

        res.json({
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
};

// Mark notification as read
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const notificationId = parseInt(req.params.id as string);

        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        });

        if (!notification) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        if (notification.userId !== req.userId) {
            res.status(403).json({ error: 'You can only mark your own notifications as read' });
            return;
        }

        const updatedNotification = await prisma.notification.update({
            where: { id: notificationId },
            data: { read: true }
        });

        res.json({
            message: 'Notification marked as read',
            notification: updatedNotification
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        await prisma.notification.updateMany({
            where: {
                userId: req.userId!,
                read: false
            },
            data: {
                read: true
            }
        });

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};

// Delete notification
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const notificationId = parseInt(req.params.id as string);

        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        });

        if (!notification) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        if (notification.userId !== req.userId) {
            res.status(403).json({ error: 'You can only delete your own notifications' });
            return;
        }

        await prisma.notification.delete({
            where: { id: notificationId }
        });

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};

// Delete all notifications
export const deleteAllNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        await prisma.notification.deleteMany({
            where: {
                userId: req.userId!
            }
        });

        res.json({ message: 'All notifications deleted' });
    } catch (error) {
        console.error('Delete all notifications error:', error);
        res.status(500).json({ error: 'Failed to delete all notifications' });
    }
};

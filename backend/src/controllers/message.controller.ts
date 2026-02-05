import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

// Get all conversations (list of users with whom the current user has exchanged messages)
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: req.userId! },
                    { receiverId: req.userId! }
                ]
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Group by conversation partner
        const conversationMap = new Map();

        messages.forEach(msg => {
            const partnerId = msg.senderId === req.userId ? msg.receiverId : msg.senderId;
            const partner = msg.senderId === req.userId ? msg.receiver : msg.sender;

            if (!conversationMap.has(partnerId)) {
                conversationMap.set(partnerId, {
                    user: partner,
                    lastMessage: msg,
                    unreadCount: 0
                });
            }

            // Count unread messages from this partner
            if (msg.receiverId === req.userId && !msg.read) {
                const conv = conversationMap.get(partnerId);
                conv.unreadCount++;
            }
        });

        const conversations = Array.from(conversationMap.values());

        res.json({ conversations });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Failed to get conversations' });
    }
};

// Get messages with a specific user
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const otherUserId = parseInt(req.params.userId as string);

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: req.userId!, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: req.userId! }
                ]
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                },
                receiver: {
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

        // Mark messages as read
        await prisma.message.updateMany({
            where: {
                senderId: otherUserId,
                receiverId: req.userId!,
                read: false
            },
            data: {
                read: true
            }
        });

        res.json({ messages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
};

// Send message
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { receiverId, content } = req.body;

        if (!receiverId || !content || !content.trim()) {
            res.status(400).json({ error: 'Receiver ID and content are required' });
            return;
        }

        if (receiverId === req.userId) {
            res.status(400).json({ error: 'You cannot send a message to yourself' });
            return;
        }

        const message = await prisma.message.create({
            data: {
                senderId: req.userId!,
                receiverId,
                content
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            }
        });

        // Create notification
        await prisma.notification.create({
            data: {
                userId: receiverId,
                type: 'message',
                content: `${message.sender.name} te ha enviado un mensaje`,
                relatedId: message.id,
                relatedUserId: req.userId!
            }
        });

        res.status(201).json({
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};

// Mark message as read
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const messageId = parseInt(req.params.id as string);

        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message) {
            res.status(404).json({ error: 'Message not found' });
            return;
        }

        if (message.receiverId !== req.userId) {
            res.status(403).json({ error: 'You can only mark your own messages as read' });
            return;
        }

        const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: { read: true }
        });

        res.json({
            message: 'Message marked as read',
            data: updatedMessage
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark message as read' });
    }
};

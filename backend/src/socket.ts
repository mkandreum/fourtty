import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './index';

interface ConnectedUser {
    userId: number;
    socketId: string;
}

const connectedUsers: ConnectedUser[] = [];

export const initSocketHandlers = (io: Server) => {
    // Middleware to verify JWT token
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('JWT_SECRET not configured');
            return next(new Error('Internal server error'));
        }

        jwt.verify(token, secret, (err: any, decoded: any) => {
            if (err) return next(new Error('Authentication error'));
            (socket as any).userId = (decoded as { userId: number }).userId;
            next();
        });
    });

    const broadcastOnlineUsers = () => {
        const onlineIds = Array.from(new Set(connectedUsers.map(u => u.userId)));
        io.emit('online_users', onlineIds);
    };

    io.on('connection', (socket: Socket) => {
        const userId = (socket as any).userId;
        if (!userId) {
            socket.disconnect();
            return;
        }

        console.log(`👤 User ${userId} connected via socket ${socket.id}`);

        // Join user to their own room for private notifications
        socket.join(`user_${userId}`);

        // Track connected user
        connectedUsers.push({ userId, socketId: socket.id });
        broadcastOnlineUsers();

        // Request initial online users
        socket.on('get_online_users', () => {
            const onlineIds = Array.from(new Set(connectedUsers.map(u => u.userId)));
            socket.emit('online_users', onlineIds);
        });

        // Chat messaging logic
        socket.on('send_message', async (data: { recipientId: number, content: string }) => {
            const { recipientId, content } = data;
            const senderId = userId; // ALWAYS use the verified userId from the token

            try {
                // Save message to DB
                const message = await prisma.message.create({
                    data: {
                        senderId,
                        receiverId: recipientId,
                        content
                    },
                    include: {
                        sender: {
                            select: { id: true, name: true, avatar: true }
                        }
                    }
                });

                // Emit to recipient's room
                io.to(`user_${recipientId}`).emit('new_message', message);
                // Also emit back to sender (for multi-device sync)
                socket.emit('message_sent', message);

                // Create notification for recipient
                await prisma.notification.create({
                    data: {
                        userId: recipientId,
                        type: 'message',
                        content: `Has recibido un nuevo mensaje de ${message.sender.name}`,
                        relatedId: senderId
                    }
                });

                io.to(`user_${recipientId}`).emit('notification', {
                    type: 'message',
                    content: `Nuevo mensaje de ${message.sender.name}`
                });

            } catch (error) {
                console.error('Error handling send_message:', error);
            }
        });

        // Typing indicators
        socket.on('typing', (data: { recipientId: number }) => {
            io.to(`user_${data.recipientId}`).emit('user_typing', { senderId: userId });
        });

        socket.on('stop_typing', (data: { recipientId: number }) => {
            io.to(`user_${data.recipientId}`).emit('user_stop_typing', { senderId: userId });
        });

        socket.on('mark_messages_read', async (data: { senderId: number }) => {
            const { senderId: partnerId } = data;
            try {
                await prisma.message.updateMany({
                    where: {
                        senderId: partnerId,
                        receiverId: userId,
                        read: false
                    },
                    data: {
                        read: true
                    }
                });

                // Notify the partner that their messages have been read
                io.to(`user_${partnerId}`).emit('messages_read', { readerId: userId });
            } catch (error) {
                console.error('Error handling mark_messages_read:', error);
            }
        });

        socket.on('disconnect', () => {
            const index = connectedUsers.findIndex(u => u.socketId === socket.id);
            if (index !== -1) {
                connectedUsers.splice(index, 1);
                console.log(`👤 User ${userId} disconnected`);
                broadcastOnlineUsers();
            }
        });
    });
};

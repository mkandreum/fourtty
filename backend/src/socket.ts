import { Server, Socket } from 'socket.io';
import { prisma } from './index';

interface ConnectedUser {
    userId: number;
    socketId: string;
}

const connectedUsers: ConnectedUser[] = [];

export const initSocketHandlers = (io: Server) => {
    const broadcastOnlineUsers = () => {
        const onlineIds = Array.from(new Set(connectedUsers.map(u => u.userId)));
        io.emit('online_users', onlineIds);
    };

    io.on('connection', (socket: Socket) => {
        console.log('👤 New client connected:', socket.id);

        // Join user to their own room for private notifications
        socket.on('authenticate', (userId: number) => {
            if (!userId) return;

            // Remove previous connections for this user (optional)
            const index = connectedUsers.findIndex(u => u.socketId === socket.id);
            if (index !== -1) {
                connectedUsers.splice(index, 1);
            }

            connectedUsers.push({ userId, socketId: socket.id });
            socket.join(`user_${userId}`);
            console.log(`🔑 User ${userId} authenticated and joined room user_${userId}`);
            broadcastOnlineUsers();
        });

        // Request initial online users
        socket.on('get_online_users', () => {
            const onlineIds = Array.from(new Set(connectedUsers.map(u => u.userId)));
            socket.emit('online_users', onlineIds);
        });

        // Chat messaging logic
        socket.on('send_message', async (data: { recipientId: number, content: string, senderId: number }) => {
            const { recipientId, content, senderId } = data;

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
        socket.on('typing', (data: { recipientId: number, senderId: number }) => {
            io.to(`user_${data.recipientId}`).emit('user_typing', { senderId: data.senderId });
        });

        socket.on('stop_typing', (data: { recipientId: number, senderId: number }) => {
            io.to(`user_${data.recipientId}`).emit('user_stop_typing', { senderId: data.senderId });
        });

        socket.on('disconnect', () => {
            const index = connectedUsers.findIndex(u => u.socketId === socket.id);
            if (index !== -1) {
                const userId = connectedUsers[index].userId;
                connectedUsers.splice(index, 1);
                console.log(`👤 User ${userId} disconnected`);
                broadcastOnlineUsers();
            }
        });
    });
};

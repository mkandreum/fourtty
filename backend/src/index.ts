import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import postRoutes from './routes/post.routes';
import commentRoutes from './routes/comment.routes';
import friendshipRoutes from './routes/friendship.routes';
import messageRoutes from './routes/message.routes';
import notificationRoutes from './routes/notification.routes';
import extraRoutes from './routes/extra.routes';
import pageRoutes from './routes/page.routes';
import invitationRoutes from './routes/invitation.routes';
import { initSocketHandlers } from './socket';
import { sendInvitationEmail } from './services/email.service';

dotenv.config();

export const prisma = new PrismaClient();

const app: Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
    }
});
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Request Logging
app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/friendships', friendshipRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/invitations', invitationRoutes);
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date(), version: '1.1.0' });
});

app.post('/api/test-email', async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const success = await sendInvitationEmail(email, 'Admin Test', 'TEST-123');
    if (success) {
        return res.json({ message: 'Email sent successfully. Check your inbox.' });
    } else {
        return res.status(500).json({ error: 'Failed to send email. Check server logs for details.' });
    }
});

app.get('/api/test-email', async (req: Request, res: Response) => {
    const { email } = req.query;
    if (!email) return res.status(400).send('Email is required as query param: ?email=test@example.com');

    const success = await sendInvitationEmail(email as string, 'Admin Test (GET)', 'TEST-456');
    if (success) {
        return res.send(`Email sent successfully to ${email}. Check your inbox.`);
    } else {
        return res.status(500).send(`Failed to send email to ${email}. Check server logs for details.`);
    }
});

app.use('/api', extraRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Handle SPA routing: return index.html for any unknown non-API route
app.get('*', (req: Request, res: Response) => {
    // If it's an API call that wasn't handled, return 404 JSON
    if (req.path.startsWith('/api')) {
        res.status(404).json({ error: 'Not Found', message: 'API Route not found' });
        return;
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
async function startServer() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to database');

        httpServer.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📁 Uploads directory: ${path.join(__dirname, '../uploads')}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⏹️  Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⏹️  Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

// Initialize Socket.io handlers
initSocketHandlers(io);

startServer();

export { app, io };
export default httpServer;

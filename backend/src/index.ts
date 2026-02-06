import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://ui-avatars.com", "*"], // Allow all images for now to fix user issues
            connectSrc: ["'self'", (process.env.FRONTEND_URL || 'http://localhost:5173'), "ws:", "wss:"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Increased from 100 to allow more headroom
    message: { error: 'Demasiadas peticiones, por favor inténtalo más tarde.' }
});
app.use('/api', globalLimiter);

// Stricter Rate Limiting for Auth
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Increased from 10 to prevent login loop lockouts
    message: { error: 'Demasiados intentos de acceso, por favor inténtalo en una hora.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

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
    const indexPath = path.join(__dirname, '../public/index.html');
    res.sendFile(indexPath);
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

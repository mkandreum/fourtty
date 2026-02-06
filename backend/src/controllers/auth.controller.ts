import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name, inviteCode } = req.body;

        // Validation
        if (!email || !password || !name || !inviteCode) {
            res.status(400).json({ error: 'Email, password, name, and invite code are required' });
            return;
        }

        // Check if invitation is valid
        const invitation = await prisma.invitation.findUnique({
            where: { code: inviteCode.toUpperCase() }
        });

        if (!invitation || invitation.used) {
            res.status(400).json({ error: 'Código de invitación inválido o ya usado' });
            return;
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=005599&color=fff&size=200`
            }
        });

        // Mark invitation as used
        await prisma.invitation.update({
            where: { id: invitation.id },
            data: {
                used: true,
                usedById: user.id
            }
        });

        // Get fresh user data with selection (including invitationsCount)
        const userDetails = await prisma.user.findUnique({
            where: { id: user.id },
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
                invitationsCount: true,
                createdAt: true
            }
        });

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: userDetails,
            token
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful',
            user: userWithoutPassword,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
};

// Get current user
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
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
                invitationsCount: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ user });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
};

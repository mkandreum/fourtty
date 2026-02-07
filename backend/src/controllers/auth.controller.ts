import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../index';
import { sendResetPasswordEmail } from '../services/email.service';
import { AuthRequest } from '../middleware/auth';

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name, lastName, inviteCode } = req.body;

        // Validation
        if (!email || !password || !name || !inviteCode) {
            res.status(400).json({ error: 'Email, password, name, and invite code are required' });
            return;
        }

        // Check if invitation is valid
        const masterCode = process.env.MASTER_INVITE_CODE;
        if (!masterCode && process.env.NODE_ENV === 'production') {
            console.warn('⚠️ MASTER_INVITE_CODE not set in production. Using insecure default.');
        }
        const activeMasterCode = masterCode || 'TWENTTY2025';
        const isMaster = inviteCode.toUpperCase() === activeMasterCode.toUpperCase();

        let invitation: any = null;
        if (!isMaster) {
            invitation = await prisma.invitation.findUnique({
                where: { code: inviteCode.toUpperCase() }
            });

            if (!invitation || invitation.used) {
                res.status(400).json({ error: 'Código de invitación inválido o ya usado' });
                return;
            }
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
                lastName: lastName || '',
                avatar: `/api/proxy/avatar?name=${encodeURIComponent(name + ' ' + (lastName || ''))}&background=005599&color=fff&size=200`,
                invitationsCount: 10 // Give some initial invitations
            }
        });

        // Mark invitation as used (only if not using master code)
        if (invitation) {
            await prisma.invitation.update({
                where: { id: invitation.id },
                data: {
                    used: true,
                    usedById: user.id
                }
            });
        }

        // Get fresh user data with selection (including invitationsCount)
        const userDetails = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                email: true,
                name: true,
                lastName: true,
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
            { expiresIn: '2h' }
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
            { expiresIn: '2h' }
        );

        // Return user without sensitive data
        const userWithoutSensitiveData = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                email: true,
                name: true,
                lastName: true,
                avatar: true,
                bio: true,
                gender: true,
                age: true,
                relationshipStatus: true,
                location: true,
                occupation: true,
                privacy: true,
                invitationsCount: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json({
            message: 'Login successful',
            user: userWithoutSensitiveData,
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
                lastName: true,
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
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
};

// Forgot Password - Send Reset Token
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Don't reveal if user exists for security
            res.json({ message: 'Si el email está registrado, recibirás un enlace de recuperación pronto.' });
            return;
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

        // Save to DB
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: resetTokenExpires
            }
        });

        // Send Email
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        await sendResetPasswordEmail(email, resetUrl);

        res.json({ message: 'Si el email está registrado, recibirás un enlace de recuperación pronto.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process forgot password request' });
    }
};

// Reset Password - Verify Token and Update Password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            res.status(400).json({ error: 'Token and new password are required' });
            return;
        }

        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: {
                    gt: new Date()
                }
            }
        });

        if (!user) {
            res.status(400).json({ error: 'Token inválido o expirado' });
            return;
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });

        res.json({ message: 'Contraseña actualizada con éxito' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};

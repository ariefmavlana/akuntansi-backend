import prisma from '@/config/database';
import crypto from 'crypto';
import { hashPassword, comparePassword } from '@/utils/password';
import { generateTokens, verifyToken } from '@/utils/jwt';
import logger from '@/utils/logger';
import { Pengguna, Role } from '@prisma/client';
import { auditService } from '@/services/audit.service';
import type {
    RegisterInput,
    LoginInput,
    RefreshTokenInput,
    ForgotPasswordInput,
    ResetPasswordInput,
    ChangePasswordInput,
} from '@/validators/auth.validator';

// Custom error classes
export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

// Types
interface AuthResponse {
    user: Omit<Pengguna, 'password'>;
    accessToken: string;
    refreshToken: string;
}

interface TokenPayload {
    userId: string;
    email: string;
    role: Role;
    perusahaanId: string;
}

/**
 * Authentication Service
 * Handles all authentication-related business logic
 */
export class AuthService {
    /**
     * Register new user
     */
    async register(data: RegisterInput): Promise<AuthResponse> {
        try {
            // Check if username already exists
            const existingUsername = await prisma.pengguna.findUnique({
                where: { username: data.username },
            });

            if (existingUsername) {
                throw new ValidationError('Username sudah digunakan');
            }

            // Check if email already exists
            const existingEmail = await prisma.pengguna.findUnique({
                where: { email: data.email },
            });

            if (existingEmail) {
                throw new ValidationError('Email sudah terdaftar');
            }

            // Verify company exists
            const company = await prisma.perusahaan.findUnique({
                where: { id: data.perusahaanId },
            });

            if (!company) {
                throw new ValidationError('Perusahaan tidak ditemukan');
            }

            // Verify branch if provided
            if (data.cabangId) {
                const branch = await prisma.cabang.findUnique({
                    where: { id: data.cabangId },
                });

                if (!branch || branch.perusahaanId !== data.perusahaanId) {
                    throw new ValidationError('Cabang tidak valid untuk perusahaan ini');
                }
            }

            // Hash password
            const hashedPassword = await hashPassword(data.password);

            // Create user
            const user = await prisma.pengguna.create({
                data: {
                    username: data.username,
                    email: data.email,
                    password: hashedPassword,
                    namaLengkap: data.namaLengkap,
                    perusahaanId: data.perusahaanId,
                    cabangId: data.cabangId,
                    telepon: data.telepon,
                    role: Role.STAFF, // Default role
                    isAktif: true,
                    emailVerified: false,
                },
            });

            logger.info(`New user registered: ${user.email}`);

            // Generate tokens
            const tokens = this.generateUserTokens(user);

            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;

            return {
                user: userWithoutPassword,
                ...tokens,
            };
        } catch (error) {
            logger.error('Registration error:', error);
            throw error;
        }
    }

    /**
     * Login user
     */
    async login(data: LoginInput): Promise<AuthResponse> {
        try {
            // Find user by email or username
            const user = await prisma.pengguna.findFirst({
                where: {
                    OR: [{ email: data.emailOrUsername }, { username: data.emailOrUsername }],
                },
            });

            if (!user) {
                throw new AuthenticationError('Email/username atau password salah');
            }

            // Check if user is active
            if (!user.isAktif) {
                throw new AuthenticationError('Akun Anda telah dinonaktifkan. Hubungi administrator.');
            }

            // Verify password
            const isPasswordValid = await comparePassword(data.password, user.password);

            if (!isPasswordValid) {
                throw new AuthenticationError('Email/username atau password salah');
            }

            // Update last login
            await prisma.pengguna.update({
                where: { id: user.id },
                data: { lastLogin: new Date() },
            });

            logger.info(`User logged in: ${user.email}`);

            // Generate tokens
            const tokens = this.generateUserTokens(user);

            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;

            return {
                user: userWithoutPassword,
                ...tokens,
            };
        } catch (error) {
            logger.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken(data: RefreshTokenInput): Promise<{ accessToken: string; refreshToken: string }> {
        try {
            // Verify refresh token
            const payload = verifyToken(data.refreshToken, 'refresh') as TokenPayload;

            // Get user
            const user = await prisma.pengguna.findUnique({
                where: { id: payload.userId },
            });

            if (!user || !user.isAktif) {
                throw new AuthenticationError('Token tidak valid');
            }

            // Generate new tokens
            const tokens = this.generateUserTokens(user);

            logger.info(`Token refreshed for user: ${user.email}`);

            return tokens;
        } catch (error) {
            logger.error('Refresh token error:', error);
            throw new AuthenticationError('Token tidak valid atau sudah kadaluarsa');
        }
    }

    /**
     * Get current user by ID
     */
    async getCurrentUser(userId: string): Promise<Omit<Pengguna, 'password'>> {
        try {
            const user = await prisma.pengguna.findUnique({
                where: { id: userId },
                include: {
                    perusahaan: {
                        select: {
                            id: true,
                            kode: true,
                            nama: true,
                            logo: true,
                        },
                    },
                    cabang: {
                        select: {
                            id: true,
                            kode: true,
                            nama: true,
                        },
                    },
                },
            });

            if (!user) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (error) {
            logger.error('Get current user error:', error);
            throw error;
        }
    }

    /**
     * Change password
     */
    async changePassword(userId: string, data: ChangePasswordInput): Promise<void> {
        try {
            // Get user
            const user = await prisma.pengguna.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Verify current password
            const isPasswordValid = await comparePassword(data.currentPassword, user.password);

            if (!isPasswordValid) {
                throw new AuthenticationError('Password lama tidak sesuai');
            }

            // Hash new password
            const hashedPassword = await hashPassword(data.newPassword);

            // Update password
            await prisma.pengguna.update({
                where: { id: userId },
                data: { password: hashedPassword },
            });

            logger.info(`Password changed for user: ${user.email}`);
        } catch (error) {
            logger.error('Change password error:', error);
            throw error;
        }
    }

    /**
     * Request password reset
     * Generates a token and stores it in DB. Logs the token (simulating email).
     */
    async requestPasswordReset(data: ForgotPasswordInput): Promise<void> {
        try {
            const user = await prisma.pengguna.findUnique({
                where: { email: data.email },
            });

            if (!user) {
                // Don't reveal if email exists or not (security best practice)
                logger.info(`Password reset requested for non-existent email: ${data.email}`);
                return;
            }

            // Generate Token
            const token = crypto.randomUUID(); // Simple UUID token
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 Hour

            await prisma.passwordResetToken.create({
                data: {
                    email: user.email,
                    token,
                    expiresAt
                }
            });

            // Log token (Mock Email Sending)
            logger.info(`[MOCK EMAIL] Password reset token for ${user.email}: ${token}`);
            logger.info(`[MOCK EMAIL] Link: https://app.example.com/reset-password?token=${token}`);

        } catch (error) {
            logger.error('Request password reset error:', error);
            throw error;
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(data: ResetPasswordInput): Promise<void> {
        try {
            const resetRecord = await prisma.passwordResetToken.findUnique({
                where: { token: data.token }
            });

            if (!resetRecord) {
                throw new ValidationError('Token tidak valid');
            }

            if (resetRecord.used) {
                throw new ValidationError('Token sudah digunakan');
            }

            if (new Date() > resetRecord.expiresAt) {
                throw new ValidationError('Token sudah kadaluwarsa');
            }

            // Update Password
            const hashedPassword = await hashPassword(data.newPassword);

            await prisma.pengguna.update({
                where: { email: resetRecord.email },
                data: { password: hashedPassword }
            });

            // Mark token used
            await prisma.passwordResetToken.update({
                where: { id: resetRecord.id },
                data: { used: true }
            });

            logger.info(`Password reset success for ${resetRecord.email}`);

        } catch (error) {
            logger.error('Reset password error:', error);
            throw error;
        }
    }

    /**
     * Logout user
     * Adds refresh token to blacklist
     */
    async logout(userId: string, refreshToken?: string): Promise<void> {
        try {
            if (refreshToken) {
                // Decode to get expiry if possible, or usually just set a standard expiry
                // For simplicity, we set expiry to 7 days from now (standard refresh token life)
                const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                await prisma.tokenBlacklist.create({
                    data: {
                        token: refreshToken,
                        expiresAt
                    }
                });
                logger.info(`Token blacklisted for user: ${userId}`);
            }

            // Audit Log
            if (userId) {
                const user = await prisma.pengguna.findUnique({ where: { id: userId } });
                if (user) {
                    auditService.logActivity({
                        perusahaanId: user.perusahaanId,
                        penggunaId: user.id,
                        aksi: 'LOGOUT',
                        modul: 'AUTH',
                        namaTabel: 'Pengguna',
                        idData: user.id,
                        keterangan: 'User logged out'
                    }).catch(err => logger.error('Audit Log Error:', err));
                }
            }

            logger.info(`User logged out: ${userId}`);
        } catch (error) {
            logger.error('Logout error:', error);
            // Don't throw on logout error, just log it
        }
    }

    /**
     * Generate JWT tokens for user
     */
    private generateUserTokens(user: Pengguna): { accessToken: string; refreshToken: string } {
        const payload: TokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            perusahaanId: user.perusahaanId,
        };

        return generateTokens(payload);
    }
}

// Export singleton instance
export const authService = new AuthService();

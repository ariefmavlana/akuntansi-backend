"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = exports.ValidationError = exports.AuthenticationError = void 0;
const database_1 = __importDefault(require("../config/database"));
const crypto_1 = __importDefault(require("crypto"));
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const logger_1 = __importDefault(require("../utils/logger"));
const client_1 = require("@prisma/client");
const audit_service_1 = require("../services/audit.service");
// Custom error classes
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Authentication Service
 * Handles all authentication-related business logic
 */
class AuthService {
    /**
     * Register new user
     */
    async register(data) {
        try {
            // Check if username already exists
            const existingUsername = await database_1.default.pengguna.findUnique({
                where: { username: data.username },
            });
            if (existingUsername) {
                throw new ValidationError('Username sudah digunakan');
            }
            // Check if email already exists
            const existingEmail = await database_1.default.pengguna.findUnique({
                where: { email: data.email },
            });
            if (existingEmail) {
                throw new ValidationError('Email sudah terdaftar');
            }
            // Verify company exists
            const company = await database_1.default.perusahaan.findUnique({
                where: { id: data.perusahaanId },
            });
            if (!company) {
                throw new ValidationError('Perusahaan tidak ditemukan');
            }
            // Verify branch if provided
            if (data.cabangId) {
                const branch = await database_1.default.cabang.findUnique({
                    where: { id: data.cabangId },
                });
                if (!branch || branch.perusahaanId !== data.perusahaanId) {
                    throw new ValidationError('Cabang tidak valid untuk perusahaan ini');
                }
            }
            // Hash password
            const hashedPassword = await (0, password_1.hashPassword)(data.password);
            // Create user
            const user = await database_1.default.pengguna.create({
                data: {
                    username: data.username,
                    email: data.email,
                    password: hashedPassword,
                    namaLengkap: data.namaLengkap,
                    perusahaanId: data.perusahaanId,
                    cabangId: data.cabangId,
                    telepon: data.telepon,
                    role: client_1.Role.STAFF, // Default role
                    isAktif: true,
                    emailVerified: false,
                },
            });
            logger_1.default.info(`New user registered: ${user.email}`);
            // Generate tokens
            const tokens = this.generateUserTokens(user);
            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;
            return {
                user: userWithoutPassword,
                tokens,
            };
        }
        catch (error) {
            logger_1.default.error('Registration error:', error);
            throw error;
        }
    }
    /**
     * Login user
     */
    async login(data) {
        try {
            // Find user by email or username
            const user = await database_1.default.pengguna.findFirst({
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
            const isPasswordValid = await (0, password_1.comparePassword)(data.password, user.password);
            if (!isPasswordValid) {
                throw new AuthenticationError('Email/username atau password salah');
            }
            // Update last login
            await database_1.default.pengguna.update({
                where: { id: user.id },
                data: { lastLogin: new Date() },
            });
            logger_1.default.info(`User logged in: ${user.email}`);
            // Generate tokens
            const tokens = this.generateUserTokens(user);
            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;
            return {
                user: userWithoutPassword,
                tokens,
            };
        }
        catch (error) {
            logger_1.default.error('Login error:', error);
            throw error;
        }
    }
    /**
     * Refresh access token
     */
    async refreshToken(data) {
        try {
            // Verify refresh token
            const payload = (0, jwt_1.verifyToken)(data.refreshToken, 'refresh');
            // Get user
            const user = await database_1.default.pengguna.findUnique({
                where: { id: payload.userId },
            });
            if (!user || !user.isAktif) {
                throw new AuthenticationError('Token tidak valid');
            }
            // Generate new access token
            const tokens = this.generateUserTokens(user);
            logger_1.default.info(`Token refreshed for user: ${user.email}`);
            return {
                accessToken: tokens.accessToken,
            };
        }
        catch (error) {
            logger_1.default.error('Refresh token error:', error);
            throw new AuthenticationError('Token tidak valid atau sudah kadaluarsa');
        }
    }
    /**
     * Get current user by ID
     */
    async getCurrentUser(userId) {
        try {
            const user = await database_1.default.pengguna.findUnique({
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
        }
        catch (error) {
            logger_1.default.error('Get current user error:', error);
            throw error;
        }
    }
    /**
     * Change password
     */
    async changePassword(userId, data) {
        try {
            // Get user
            const user = await database_1.default.pengguna.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new AuthenticationError('User tidak ditemukan');
            }
            // Verify current password
            const isPasswordValid = await (0, password_1.comparePassword)(data.currentPassword, user.password);
            if (!isPasswordValid) {
                throw new AuthenticationError('Password lama tidak sesuai');
            }
            // Hash new password
            const hashedPassword = await (0, password_1.hashPassword)(data.newPassword);
            // Update password
            await database_1.default.pengguna.update({
                where: { id: userId },
                data: { password: hashedPassword },
            });
            logger_1.default.info(`Password changed for user: ${user.email}`);
        }
        catch (error) {
            logger_1.default.error('Change password error:', error);
            throw error;
        }
    }
    /**
     * Request password reset
     * Generates a token and stores it in DB. Logs the token (simulating email).
     */
    async requestPasswordReset(data) {
        try {
            const user = await database_1.default.pengguna.findUnique({
                where: { email: data.email },
            });
            if (!user) {
                // Don't reveal if email exists or not (security best practice)
                logger_1.default.info(`Password reset requested for non-existent email: ${data.email}`);
                return;
            }
            // Generate Token
            const token = crypto_1.default.randomUUID(); // Simple UUID token
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 Hour
            await database_1.default.passwordResetToken.create({
                data: {
                    email: user.email,
                    token,
                    expiresAt
                }
            });
            // Log token (Mock Email Sending)
            logger_1.default.info(`[MOCK EMAIL] Password reset token for ${user.email}: ${token}`);
            logger_1.default.info(`[MOCK EMAIL] Link: https://app.example.com/reset-password?token=${token}`);
        }
        catch (error) {
            logger_1.default.error('Request password reset error:', error);
            throw error;
        }
    }
    /**
     * Reset password with token
     */
    async resetPassword(data) {
        try {
            const resetRecord = await database_1.default.passwordResetToken.findUnique({
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
            const hashedPassword = await (0, password_1.hashPassword)(data.newPassword);
            await database_1.default.pengguna.update({
                where: { email: resetRecord.email },
                data: { password: hashedPassword }
            });
            // Mark token used
            await database_1.default.passwordResetToken.update({
                where: { id: resetRecord.id },
                data: { used: true }
            });
            logger_1.default.info(`Password reset success for ${resetRecord.email}`);
        }
        catch (error) {
            logger_1.default.error('Reset password error:', error);
            throw error;
        }
    }
    /**
     * Logout user
     * Adds refresh token to blacklist
     */
    async logout(userId, refreshToken) {
        try {
            if (refreshToken) {
                // Decode to get expiry if possible, or usually just set a standard expiry
                // For simplicity, we set expiry to 7 days from now (standard refresh token life)
                const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                await database_1.default.tokenBlacklist.create({
                    data: {
                        token: refreshToken,
                        expiresAt
                    }
                });
                logger_1.default.info(`Token blacklisted for user: ${userId}`);
            }
            // Audit Log
            if (userId) {
                const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
                if (user) {
                    audit_service_1.auditService.logActivity({
                        perusahaanId: user.perusahaanId,
                        penggunaId: user.id,
                        aksi: 'LOGOUT',
                        modul: 'AUTH',
                        namaTabel: 'Pengguna',
                        idData: user.id,
                        keterangan: 'User logged out'
                    }).catch(err => logger_1.default.error('Audit Log Error:', err));
                }
            }
            logger_1.default.info(`User logged out: ${userId}`);
        }
        catch (error) {
            logger_1.default.error('Logout error:', error);
            // Don't throw on logout error, just log it
        }
    }
    /**
     * Generate JWT tokens for user
     */
    generateUserTokens(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            perusahaanId: user.perusahaanId,
        };
        return (0, jwt_1.generateTokens)(payload);
    }
}
exports.AuthService = AuthService;
// Export singleton instance
exports.authService = new AuthService();

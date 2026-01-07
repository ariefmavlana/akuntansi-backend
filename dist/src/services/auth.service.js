"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = exports.ValidationError = exports.AuthenticationError = void 0;
const database_1 = __importDefault(require("../config/database"));
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const logger_1 = __importDefault(require("../utils/logger"));
const client_1 = require("@prisma/client");
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
     * TODO: Implement email sending with reset token
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
            // TODO: Generate reset token and send email
            // For now, just log
            logger_1.default.info(`Password reset requested for: ${user.email}`);
            // In production:
            // 1. Generate secure random token
            // 2. Store token in database with expiry (e.g., 1 hour)
            // 3. Send email with reset link
        }
        catch (error) {
            logger_1.default.error('Request password reset error:', error);
            throw error;
        }
    }
    /**
     * Reset password with token
     * TODO: Implement token verification and password reset
     */
    async resetPassword(data) {
        try {
            // TODO: Verify reset token from database
            // For now, throw error
            throw new ValidationError('Fitur reset password belum diimplementasikan');
            // In production:
            // 1. Verify token exists and not expired
            // 2. Get user from token
            // 3. Hash new password
            // 4. Update user password
            // 5. Delete/invalidate token
        }
        catch (error) {
            logger_1.default.error('Reset password error:', error);
            throw error;
        }
    }
    /**
     * Logout user
     * TODO: Implement token blacklist
     */
    async logout(userId) {
        try {
            logger_1.default.info(`User logged out: ${userId}`);
            // TODO: Add refresh token to blacklist
            // In production:
            // 1. Store refresh token in Redis blacklist
            // 2. Set expiry to match token expiry
            // 3. Check blacklist on refresh token endpoint
        }
        catch (error) {
            logger_1.default.error('Logout error:', error);
            throw error;
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

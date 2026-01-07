"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const response_1 = require("../utils/response");
/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */
class AuthController {
    /**
     * Register new user
     * POST /api/v1/auth/register
     */
    async register(req, res, next) {
        try {
            const result = await auth_service_1.authService.register(req.body);
            (0, response_1.successResponse)(res, result, 'Registrasi berhasil', 201);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Login user
     * POST /api/v1/auth/login
     */
    async login(req, res, next) {
        try {
            const result = await auth_service_1.authService.login(req.body);
            (0, response_1.successResponse)(res, result, 'Login berhasil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Refresh access token
     * POST /api/v1/auth/refresh
     */
    async refreshToken(req, res, next) {
        try {
            const result = await auth_service_1.authService.refreshToken(req.body);
            (0, response_1.successResponse)(res, result, 'Token berhasil diperbarui');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Logout user
     * POST /api/v1/auth/logout
     */
    async logout(req, res, next) {
        try {
            const userId = req.user.userId;
            await auth_service_1.authService.logout(userId);
            (0, response_1.successResponse)(res, null, 'Logout berhasil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get current user
     * GET /api/v1/auth/me
     */
    async getCurrentUser(req, res, next) {
        try {
            const userId = req.user.userId;
            const user = await auth_service_1.authService.getCurrentUser(userId);
            (0, response_1.successResponse)(res, user, 'Data user berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Change password
     * POST /api/v1/auth/change-password
     */
    async changePassword(req, res, next) {
        try {
            const userId = req.user.userId;
            await auth_service_1.authService.changePassword(userId, req.body);
            (0, response_1.successResponse)(res, null, 'Password berhasil diubah');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Request password reset
     * POST /api/v1/auth/forgot-password
     */
    async forgotPassword(req, res, next) {
        try {
            await auth_service_1.authService.requestPasswordReset(req.body);
            (0, response_1.successResponse)(res, null, 'Jika email terdaftar, link reset password akan dikirim ke email Anda');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Reset password with token
     * POST /api/v1/auth/reset-password
     */
    async resetPassword(req, res, next) {
        try {
            await auth_service_1.authService.resetPassword(req.body);
            (0, response_1.successResponse)(res, null, 'Password berhasil direset');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
// Export singleton instance
exports.authController = new AuthController();

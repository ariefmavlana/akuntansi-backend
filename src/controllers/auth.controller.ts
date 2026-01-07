import { Request, Response, NextFunction } from 'express';
import { authService, AuthenticationError, ValidationError } from '@/services/auth.service';
import { successResponse, errorResponse } from '@/utils/response';
import logger from '@/utils/logger';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */
export class AuthController {
    /**
     * Register new user
     * POST /api/v1/auth/register
     */
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await authService.register(req.body);

            successResponse(res, result, 'Registrasi berhasil', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Login user
     * POST /api/v1/auth/login
     */
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await authService.login(req.body);

            successResponse(res, result, 'Login berhasil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Refresh access token
     * POST /api/v1/auth/refresh
     */
    async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await authService.refreshToken(req.body);

            successResponse(res, result, 'Token berhasil diperbarui');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Logout user
     * POST /api/v1/auth/logout
     */
    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            await authService.logout(userId);

            successResponse(res, null, 'Logout berhasil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get current user
     * GET /api/v1/auth/me
     */
    async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const user = await authService.getCurrentUser(userId);

            successResponse(res, user, 'Data user berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Change password
     * POST /api/v1/auth/change-password
     */
    async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            await authService.changePassword(userId, req.body);

            successResponse(res, null, 'Password berhasil diubah');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Request password reset
     * POST /api/v1/auth/forgot-password
     */
    async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await authService.requestPasswordReset(req.body);

            successResponse(
                res,
                null,
                'Jika email terdaftar, link reset password akan dikirim ke email Anda'
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reset password with token
     * POST /api/v1/auth/reset-password
     */
    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await authService.resetPassword(req.body);

            successResponse(res, null, 'Password berhasil direset');
        } catch (error) {
            next(error);
        }
    }
}

// Export singleton instance
export const authController = new AuthController();

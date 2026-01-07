import { Request, Response, NextFunction } from 'express';
import { userService } from '@/services/user.service';
import { successResponse } from '@/utils/response';

/**
 * User Controller
 * Handles HTTP requests for user management endpoints
 */
export class UserController {
    /**
     * List users with pagination and filters
     * GET /api/v1/users
     */
    async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const result = await userService.listUsers(req.query as any, requestingUserId);

            successResponse(res, result.data, 'Data user berhasil diambil', 200, result.meta);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user by ID
     * GET /api/v1/users/:id
     */
    async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await userService.getUserById(req.params.id);

            successResponse(res, user, 'Data user berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user
     * PUT /api/v1/users/:id
     */
    async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const user = await userService.updateUser(req.params.id, req.body, requestingUserId);

            successResponse(res, user, 'User berhasil diupdate');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user role
     * PUT /api/v1/users/:id/role
     */
    async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const user = await userService.updateUserRole(
                req.params.id,
                req.body.role,
                requestingUserId
            );

            successResponse(res, user, 'Role user berhasil diupdate');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Activate user
     * PUT /api/v1/users/:id/activate
     */
    async activateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            await userService.activateUser(req.params.id, requestingUserId);

            successResponse(res, null, 'User berhasil diaktifkan');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Deactivate user
     * PUT /api/v1/users/:id/deactivate
     */
    async deactivateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            await userService.deactivateUser(req.params.id, requestingUserId);

            successResponse(res, null, 'User berhasil dinonaktifkan');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete user (soft delete)
     * DELETE /api/v1/users/:id
     */
    async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            await userService.deleteUser(req.params.id, requestingUserId);

            successResponse(res, null, 'User berhasil dihapus');
        } catch (error) {
            next(error);
        }
    }
}

// Export singleton instance
export const userController = new UserController();

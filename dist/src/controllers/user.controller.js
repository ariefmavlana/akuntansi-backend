"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const response_1 = require("../utils/response");
/**
 * User Controller
 * Handles HTTP requests for user management endpoints
 */
class UserController {
    /**
     * List users with pagination and filters
     * GET /api/v1/users
     */
    async listUsers(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const result = await user_service_1.userService.listUsers(req.query, requestingUserId);
            (0, response_1.successResponse)(res, result.data, 'Data user berhasil diambil', 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get user by ID
     * GET /api/v1/users/:id
     */
    async getUserById(req, res, next) {
        try {
            const user = await user_service_1.userService.getUserById(req.params.id);
            (0, response_1.successResponse)(res, user, 'Data user berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update user
     * PUT /api/v1/users/:id
     */
    async updateUser(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const user = await user_service_1.userService.updateUser(req.params.id, req.body, requestingUserId);
            (0, response_1.successResponse)(res, user, 'User berhasil diupdate');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update user role
     * PUT /api/v1/users/:id/role
     */
    async updateUserRole(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const user = await user_service_1.userService.updateUserRole(req.params.id, req.body.role, requestingUserId);
            (0, response_1.successResponse)(res, user, 'Role user berhasil diupdate');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Activate user
     * PUT /api/v1/users/:id/activate
     */
    async activateUser(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            await user_service_1.userService.activateUser(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, null, 'User berhasil diaktifkan');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Deactivate user
     * PUT /api/v1/users/:id/deactivate
     */
    async deactivateUser(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            await user_service_1.userService.deactivateUser(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, null, 'User berhasil dinonaktifkan');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete user (soft delete)
     * DELETE /api/v1/users/:id
     */
    async deleteUser(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            await user_service_1.userService.deleteUser(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, null, 'User berhasil dihapus');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
// Export singleton instance
exports.userController = new UserController();

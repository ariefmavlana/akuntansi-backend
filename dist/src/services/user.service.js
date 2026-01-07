"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const client_1 = require("@prisma/client");
const auth_service_1 = require("./auth.service");
/**
 * User Service
 * Handles user management business logic
 */
class UserService {
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        try {
            const user = await database_1.default.pengguna.findUnique({
                where: { id: userId },
                include: {
                    perusahaan: {
                        select: {
                            id: true,
                            kode: true,
                            nama: true,
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
                throw new auth_service_1.ValidationError('User tidak ditemukan');
            }
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        catch (error) {
            logger_1.default.error('Get user by ID error:', error);
            throw error;
        }
    }
    /**
     * List users with pagination and filters
     */
    async listUsers(filters, requestingUserId) {
        try {
            const { page = 1, limit = 10, search, role, isAktif, perusahaanId, cabangId } = filters;
            // Get requesting user to check permissions
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Build where clause
            const where = {};
            // Non-superadmin can only see users from their company
            if (requestingUser.role !== client_1.Role.SUPERADMIN) {
                where.perusahaanId = requestingUser.perusahaanId;
            }
            else if (perusahaanId) {
                where.perusahaanId = perusahaanId;
            }
            if (cabangId) {
                where.cabangId = cabangId;
            }
            if (role) {
                where.role = role;
            }
            if (isAktif !== undefined) {
                where.isAktif = isAktif;
            }
            if (search) {
                where.OR = [
                    { namaLengkap: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } },
                ];
            }
            // Get total count
            const total = await database_1.default.pengguna.count({ where });
            // Get users
            const users = await database_1.default.pengguna.findMany({
                where,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    namaLengkap: true,
                    role: true,
                    foto: true,
                    telepon: true,
                    isAktif: true,
                    emailVerified: true,
                    lastLogin: true,
                    createdAt: true,
                    perusahaan: {
                        select: {
                            id: true,
                            kode: true,
                            nama: true,
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
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            });
            return {
                data: users,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            logger_1.default.error('List users error:', error);
            throw error;
        }
    }
    /**
     * Update user profile
     */
    async updateUser(userId, data, requestingUserId) {
        try {
            // Get requesting user
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Get target user
            const targetUser = await database_1.default.pengguna.findUnique({
                where: { id: userId },
            });
            if (!targetUser) {
                throw new auth_service_1.ValidationError('User yang akan diupdate tidak ditemukan');
            }
            // Check permissions
            const isSelf = userId === requestingUserId;
            const isAdmin = ['SUPERADMIN', 'ADMIN'].includes(requestingUser.role);
            const isSameCompany = targetUser.perusahaanId === requestingUser.perusahaanId;
            if (!isSelf && !(isAdmin && isSameCompany)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk mengupdate user ini');
            }
            // Verify branch if provided
            if (data.cabangId) {
                const branch = await database_1.default.cabang.findUnique({
                    where: { id: data.cabangId },
                });
                if (!branch || branch.perusahaanId !== targetUser.perusahaanId) {
                    throw new auth_service_1.ValidationError('Cabang tidak valid untuk perusahaan ini');
                }
            }
            // Update user
            const updatedUser = await database_1.default.pengguna.update({
                where: { id: userId },
                data: {
                    namaLengkap: data.namaLengkap,
                    telepon: data.telepon,
                    foto: data.foto,
                    cabangId: data.cabangId,
                },
            });
            logger_1.default.info(`User updated: ${updatedUser.email} by ${requestingUser.email}`);
            const { password: _, ...userWithoutPassword } = updatedUser;
            return userWithoutPassword;
        }
        catch (error) {
            logger_1.default.error('Update user error:', error);
            throw error;
        }
    }
    /**
     * Update user role (admin only)
     */
    async updateUserRole(userId, newRole, requestingUserId) {
        try {
            // Get requesting user
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Only SUPERADMIN and ADMIN can change roles
            if (!['SUPERADMIN', 'ADMIN'].includes(requestingUser.role)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk mengubah role user');
            }
            // Get target user
            const targetUser = await database_1.default.pengguna.findUnique({
                where: { id: userId },
            });
            if (!targetUser) {
                throw new auth_service_1.ValidationError('User tidak ditemukan');
            }
            // ADMIN can only manage users in their company
            if (requestingUser.role === client_1.Role.ADMIN &&
                targetUser.perusahaanId !== requestingUser.perusahaanId) {
                throw new auth_service_1.AuthenticationError('Anda hanya dapat mengubah role user di perusahaan Anda');
            }
            // ADMIN cannot create SUPERADMIN
            if (requestingUser.role === client_1.Role.ADMIN && newRole === client_1.Role.SUPERADMIN) {
                throw new auth_service_1.AuthenticationError('Anda tidak dapat membuat user SUPERADMIN');
            }
            // Update role
            const updatedUser = await database_1.default.pengguna.update({
                where: { id: userId },
                data: { role: newRole },
            });
            logger_1.default.info(`User role updated: ${updatedUser.email} to ${newRole} by ${requestingUser.email}`);
            const { password: _, ...userWithoutPassword } = updatedUser;
            return userWithoutPassword;
        }
        catch (error) {
            logger_1.default.error('Update user role error:', error);
            throw error;
        }
    }
    /**
     * Activate user
     */
    async activateUser(userId, requestingUserId) {
        await this.toggleUserStatus(userId, true, requestingUserId);
    }
    /**
     * Deactivate user
     */
    async deactivateUser(userId, requestingUserId) {
        await this.toggleUserStatus(userId, false, requestingUserId);
    }
    /**
     * Toggle user active status
     */
    async toggleUserStatus(userId, isAktif, requestingUserId) {
        try {
            // Get requesting user
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Only SUPERADMIN and ADMIN can activate/deactivate
            if (!['SUPERADMIN', 'ADMIN'].includes(requestingUser.role)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk mengubah status user');
            }
            // Get target user
            const targetUser = await database_1.default.pengguna.findUnique({
                where: { id: userId },
            });
            if (!targetUser) {
                throw new auth_service_1.ValidationError('User tidak ditemukan');
            }
            // Cannot deactivate self
            if (userId === requestingUserId) {
                throw new auth_service_1.ValidationError('Anda tidak dapat menonaktifkan akun Anda sendiri');
            }
            // ADMIN can only manage users in their company
            if (requestingUser.role === client_1.Role.ADMIN &&
                targetUser.perusahaanId !== requestingUser.perusahaanId) {
                throw new auth_service_1.AuthenticationError('Anda hanya dapat mengubah status user di perusahaan Anda');
            }
            // Update status
            await database_1.default.pengguna.update({
                where: { id: userId },
                data: { isAktif },
            });
            logger_1.default.info(`User ${isAktif ? 'activated' : 'deactivated'}: ${targetUser.email} by ${requestingUser.email}`);
        }
        catch (error) {
            logger_1.default.error('Toggle user status error:', error);
            throw error;
        }
    }
    /**
     * Soft delete user (deactivate)
     */
    async deleteUser(userId, requestingUserId) {
        await this.deactivateUser(userId, requestingUserId);
    }
}
exports.UserService = UserService;
// Export singleton instance
exports.userService = new UserService();

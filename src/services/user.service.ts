import prisma from '@/config/database';
import logger from '@/utils/logger';
import { hashPassword } from '@/utils/password';
import { Pengguna, Role } from '@prisma/client';
import type { ListUsersInput, UpdateUserInput } from '@/validators/user.validator';
import { AuthenticationError, ValidationError } from './auth.service';

/**
 * User Service
 * Handles user management business logic
 */
export class UserService {
    /**
     * Get user by ID
     */
    async getUserById(userId: string): Promise<Omit<Pengguna, 'password'>> {
        try {
            const user = await prisma.pengguna.findUnique({
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
                throw new ValidationError('User tidak ditemukan');
            }

            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (error) {
            logger.error('Get user by ID error:', error);
            throw error;
        }
    }

    /**
     * List users with pagination and filters
     */
    async listUsers(filters: ListUsersInput, requestingUserId: string) {
        try {
            const { page = 1, limit = 10, search, role, isAktif, perusahaanId, cabangId } = filters;

            // Get requesting user to check permissions
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Build where clause
            const where: any = {};

            // Non-superadmin can only see users from their company
            if (requestingUser.role !== Role.SUPERADMIN) {
                where.perusahaanId = requestingUser.perusahaanId;
            } else if (perusahaanId) {
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
            const total = await prisma.pengguna.count({ where });

            // Get users
            const users = await prisma.pengguna.findMany({
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
        } catch (error) {
            logger.error('List users error:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateUser(
        userId: string,
        data: UpdateUserInput['body'],
        requestingUserId: string
    ): Promise<Omit<Pengguna, 'password'>> {
        try {
            // Get requesting user
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Get target user
            const targetUser = await prisma.pengguna.findUnique({
                where: { id: userId },
            });

            if (!targetUser) {
                throw new ValidationError('User yang akan diupdate tidak ditemukan');
            }

            // Check permissions
            const isSelf = userId === requestingUserId;
            const isAdmin = ['SUPERADMIN', 'ADMIN'].includes(requestingUser.role);
            const isSameCompany = targetUser.perusahaanId === requestingUser.perusahaanId;

            if (!isSelf && !(isAdmin && isSameCompany)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk mengupdate user ini');
            }

            // Verify branch if provided
            if (data.cabangId) {
                const branch = await prisma.cabang.findUnique({
                    where: { id: data.cabangId },
                });

                if (!branch || branch.perusahaanId !== targetUser.perusahaanId) {
                    throw new ValidationError('Cabang tidak valid untuk perusahaan ini');
                }
            }

            // Update user
            const updatedUser = await prisma.pengguna.update({
                where: { id: userId },
                data: {
                    namaLengkap: data.namaLengkap,
                    telepon: data.telepon,
                    foto: data.foto,
                    cabangId: data.cabangId,
                },
            });

            logger.info(`User updated: ${updatedUser.email} by ${requestingUser.email}`);

            const { password: _, ...userWithoutPassword } = updatedUser;
            return userWithoutPassword;
        } catch (error) {
            logger.error('Update user error:', error);
            throw error;
        }
    }

    /**
     * Update user role (admin only)
     */
    async updateUserRole(
        userId: string,
        newRole: Role,
        requestingUserId: string
    ): Promise<Omit<Pengguna, 'password'>> {
        try {
            // Get requesting user
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Only SUPERADMIN and ADMIN can change roles
            if (!['SUPERADMIN', 'ADMIN'].includes(requestingUser.role)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk mengubah role user');
            }

            // Get target user
            const targetUser = await prisma.pengguna.findUnique({
                where: { id: userId },
            });

            if (!targetUser) {
                throw new ValidationError('User tidak ditemukan');
            }

            // ADMIN can only manage users in their company
            if (
                requestingUser.role === Role.ADMIN &&
                targetUser.perusahaanId !== requestingUser.perusahaanId
            ) {
                throw new AuthenticationError('Anda hanya dapat mengubah role user di perusahaan Anda');
            }

            // ADMIN cannot create SUPERADMIN
            if (requestingUser.role === Role.ADMIN && newRole === Role.SUPERADMIN) {
                throw new AuthenticationError('Anda tidak dapat membuat user SUPERADMIN');
            }

            // Update role
            const updatedUser = await prisma.pengguna.update({
                where: { id: userId },
                data: { role: newRole },
            });

            logger.info(
                `User role updated: ${updatedUser.email} to ${newRole} by ${requestingUser.email}`
            );

            const { password: _, ...userWithoutPassword } = updatedUser;
            return userWithoutPassword;
        } catch (error) {
            logger.error('Update user role error:', error);
            throw error;
        }
    }

    /**
     * Activate user
     */
    async activateUser(userId: string, requestingUserId: string): Promise<void> {
        await this.toggleUserStatus(userId, true, requestingUserId);
    }

    /**
     * Deactivate user
     */
    async deactivateUser(userId: string, requestingUserId: string): Promise<void> {
        await this.toggleUserStatus(userId, false, requestingUserId);
    }

    /**
     * Toggle user active status
     */
    private async toggleUserStatus(
        userId: string,
        isAktif: boolean,
        requestingUserId: string
    ): Promise<void> {
        try {
            // Get requesting user
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Only SUPERADMIN and ADMIN can activate/deactivate
            if (!['SUPERADMIN', 'ADMIN'].includes(requestingUser.role)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk mengubah status user');
            }

            // Get target user
            const targetUser = await prisma.pengguna.findUnique({
                where: { id: userId },
            });

            if (!targetUser) {
                throw new ValidationError('User tidak ditemukan');
            }

            // Cannot deactivate self
            if (userId === requestingUserId) {
                throw new ValidationError('Anda tidak dapat menonaktifkan akun Anda sendiri');
            }

            // ADMIN can only manage users in their company
            if (
                requestingUser.role === Role.ADMIN &&
                targetUser.perusahaanId !== requestingUser.perusahaanId
            ) {
                throw new AuthenticationError('Anda hanya dapat mengubah status user di perusahaan Anda');
            }

            // Update status
            await prisma.pengguna.update({
                where: { id: userId },
                data: { isAktif },
            });

            logger.info(
                `User ${isAktif ? 'activated' : 'deactivated'}: ${targetUser.email} by ${requestingUser.email}`
            );
        } catch (error) {
            logger.error('Toggle user status error:', error);
            throw error;
        }
    }

    /**
     * Soft delete user (deactivate)
     */
    async deleteUser(userId: string, requestingUserId: string): Promise<void> {
        await this.deactivateUser(userId, requestingUserId);
    }
}

// Export singleton instance
export const userService = new UserService();

import { z } from 'zod';
import { Role } from '@prisma/client';

// Get user by ID schema
export const getUserByIdSchema = z.object({
    params: z.object({
        id: z.string().cuid('User ID tidak valid'),
    }),
});

// Update user schema
export const updateUserSchema = z.object({
    params: z.object({
        id: z.string().cuid('User ID tidak valid'),
    }),
    body: z.object({
        namaLengkap: z.string().min(1, 'Nama lengkap wajib diisi').optional(),
        telepon: z.string().optional(),
        foto: z.string().url('URL foto tidak valid').optional(),
        cabangId: z.string().cuid('Cabang ID tidak valid').optional().nullable(),
    }),
});

// Update user role schema (admin only)
export const updateUserRoleSchema = z.object({
    params: z.object({
        id: z.string().cuid('User ID tidak valid'),
    }),
    body: z.object({
        role: z.nativeEnum(Role, { errorMap: () => ({ message: 'Role tidak valid' }) }),
    }),
});

// List users schema (with pagination and filters)
export const listUsersSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
        search: z.string().optional(),
        role: z.nativeEnum(Role).optional(),
        isAktif: z
            .string()
            .transform((val) => val === 'true')
            .optional(),
        perusahaanId: z.string().cuid().optional(),
        cabangId: z.string().cuid().optional(),
    }),
});

// Delete user schema
export const deleteUserSchema = z.object({
    params: z.object({
        id: z.string().cuid('User ID tidak valid'),
    }),
});

// Activate/Deactivate user schema
export const toggleUserStatusSchema = z.object({
    params: z.object({
        id: z.string().cuid('User ID tidak valid'),
    }),
    body: z.object({
        isAktif: z.boolean(),
    }),
});

// TypeScript types
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>['params'];
export type UpdateUserInput = {
    params: z.infer<typeof updateUserSchema>['params'];
    body: z.infer<typeof updateUserSchema>['body'];
};
export type UpdateUserRoleInput = {
    params: z.infer<typeof updateUserRoleSchema>['params'];
    body: z.infer<typeof updateUserRoleSchema>['body'];
};
export type ListUsersInput = z.infer<typeof listUsersSchema>['query'];
export type DeleteUserInput = z.infer<typeof deleteUserSchema>['params'];
export type ToggleUserStatusInput = {
    params: z.infer<typeof toggleUserStatusSchema>['params'];
    body: z.infer<typeof toggleUserStatusSchema>['body'];
};

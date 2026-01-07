"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleUserStatusSchema = exports.deleteUserSchema = exports.listUsersSchema = exports.updateUserRoleSchema = exports.updateUserSchema = exports.getUserByIdSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// Get user by ID schema
exports.getUserByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('User ID tidak valid'),
    }),
});
// Update user schema
exports.updateUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('User ID tidak valid'),
    }),
    body: zod_1.z.object({
        namaLengkap: zod_1.z.string().min(1, 'Nama lengkap wajib diisi').optional(),
        telepon: zod_1.z.string().optional(),
        foto: zod_1.z.string().url('URL foto tidak valid').optional(),
        cabangId: zod_1.z.string().cuid('Cabang ID tidak valid').optional().nullable(),
    }),
});
// Update user role schema (admin only)
exports.updateUserRoleSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('User ID tidak valid'),
    }),
    body: zod_1.z.object({
        role: zod_1.z.nativeEnum(client_1.Role, { errorMap: () => ({ message: 'Role tidak valid' }) }),
    }),
});
// List users schema (with pagination and filters)
exports.listUsersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
        search: zod_1.z.string().optional(),
        role: zod_1.z.nativeEnum(client_1.Role).optional(),
        isAktif: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional(),
        perusahaanId: zod_1.z.string().cuid().optional(),
        cabangId: zod_1.z.string().cuid().optional(),
    }),
});
// Delete user schema
exports.deleteUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('User ID tidak valid'),
    }),
});
// Activate/Deactivate user schema
exports.toggleUserStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('User ID tidak valid'),
    }),
    body: zod_1.z.object({
        isAktif: zod_1.z.boolean(),
    }),
});

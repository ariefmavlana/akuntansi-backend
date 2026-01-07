"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.verifyEmailSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// Register schema
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        username: zod_1.z
            .string()
            .min(3, 'Username minimal 3 karakter')
            .max(50, 'Username maksimal 50 karakter')
            .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
        email: zod_1.z.string().email('Email tidak valid'),
        password: zod_1.z
            .string()
            .min(8, 'Password minimal 8 karakter')
            .regex(/[A-Z]/, 'Password harus mengandung minimal 1 huruf besar')
            .regex(/[a-z]/, 'Password harus mengandung minimal 1 huruf kecil')
            .regex(/[0-9]/, 'Password harus mengandung minimal 1 angka'),
        namaLengkap: zod_1.z.string().min(1, 'Nama lengkap wajib diisi'),
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        cabangId: zod_1.z.string().cuid('Cabang ID tidak valid').optional(),
        telepon: zod_1.z.string().optional(),
    }),
});
// Login schema
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        emailOrUsername: zod_1.z.string().min(1, 'Email atau username wajib diisi'),
        password: zod_1.z.string().min(1, 'Password wajib diisi'),
    }),
});
// Refresh token schema
exports.refreshTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token wajib diisi'),
    }),
});
// Forgot password schema
exports.forgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Email tidak valid'),
    }),
});
// Reset password schema
exports.resetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1, 'Token wajib diisi'),
        newPassword: zod_1.z
            .string()
            .min(8, 'Password minimal 8 karakter')
            .regex(/[A-Z]/, 'Password harus mengandung minimal 1 huruf besar')
            .regex(/[a-z]/, 'Password harus mengandung minimal 1 huruf kecil')
            .regex(/[0-9]/, 'Password harus mengandung minimal 1 angka'),
    }),
});
// Verify email schema
exports.verifyEmailSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1, 'Token wajib diisi'),
    }),
});
// Change password schema
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string().min(1, 'Password lama wajib diisi'),
        newPassword: zod_1.z
            .string()
            .min(8, 'Password minimal 8 karakter')
            .regex(/[A-Z]/, 'Password harus mengandung minimal 1 huruf besar')
            .regex(/[a-z]/, 'Password harus mengandung minimal 1 huruf kecil')
            .regex(/[0-9]/, 'Password harus mengandung minimal 1 angka'),
    }),
});

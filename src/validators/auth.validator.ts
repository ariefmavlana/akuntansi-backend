import { z } from 'zod';

// Register schema
export const registerSchema = z.object({
    body: z.object({
        username: z
            .string()
            .min(3, 'Username minimal 3 karakter')
            .max(50, 'Username maksimal 50 karakter')
            .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore'),
        email: z.string().email('Email tidak valid'),
        password: z
            .string()
            .min(8, 'Password minimal 8 karakter')
            .regex(/[A-Z]/, 'Password harus mengandung minimal 1 huruf besar')
            .regex(/[a-z]/, 'Password harus mengandung minimal 1 huruf kecil')
            .regex(/[0-9]/, 'Password harus mengandung minimal 1 angka'),
        namaLengkap: z.string().min(1, 'Nama lengkap wajib diisi'),
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        cabangId: z.string().cuid('Cabang ID tidak valid').optional(),
        telepon: z.string().optional(),
    }),
});

// Login schema
export const loginSchema = z.object({
    body: z.object({
        emailOrUsername: z.string().min(1, 'Email atau username wajib diisi'),
        password: z.string().min(1, 'Password wajib diisi'),
    }),
});

// Refresh token schema
export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token wajib diisi'),
    }),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Email tidak valid'),
    }),
});

// Reset password schema
export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Token wajib diisi'),
        newPassword: z
            .string()
            .min(8, 'Password minimal 8 karakter')
            .regex(/[A-Z]/, 'Password harus mengandung minimal 1 huruf besar')
            .regex(/[a-z]/, 'Password harus mengandung minimal 1 huruf kecil')
            .regex(/[0-9]/, 'Password harus mengandung minimal 1 angka'),
    }),
});

// Verify email schema
export const verifyEmailSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Token wajib diisi'),
    }),
});

// Change password schema
export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, 'Password lama wajib diisi'),
        newPassword: z
            .string()
            .min(8, 'Password minimal 8 karakter')
            .regex(/[A-Z]/, 'Password harus mengandung minimal 1 huruf besar')
            .regex(/[a-z]/, 'Password harus mengandung minimal 1 huruf kecil')
            .regex(/[0-9]/, 'Password harus mengandung minimal 1 angka'),
    }),
});

// TypeScript types inferred from schemas
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];

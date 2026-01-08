import { z } from 'zod';

// Create payroll schema (Manual Single Entry)
export const createPayrollSchema = z.object({
    body: z.object({
        karyawanId: z.string().cuid('Karyawan ID tidak valid'),
        periode: z.string().regex(/^\d{4}-\d{2}$/, 'Format periode harus YYYY-MM'),
        tanggalBayar: z.string().datetime().or(z.date()),

        gajiPokok: z.number().min(0, 'Gaji pokok harus positif'),
        tunjangan: z.number().min(0).default(0),
        lembur: z.number().min(0).default(0),
        bonus: z.number().min(0).default(0),

        potonganBpjs: z.number().min(0).default(0),
        potonganPph21: z.number().min(0).default(0),
        potonganLainnya: z.number().min(0).default(0),

        keterangan: z.string().optional(),
    }),
});

// Generate payroll schema (Batch)
export const generatePayrollSchema = z.object({
    body: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        periode: z.string().regex(/^\d{4}-\d{2}$/, 'Format periode harus YYYY-MM'),
        tanggalBayar: z.string().datetime().or(z.date()),
    }),
});

// Update payroll schema
export const updatePayrollSchema = z.object({
    params: z.object({
        id: z.string().cuid('Payroll ID tidak valid'),
    }),
    body: z.object({
        tanggalBayar: z.string().datetime().or(z.date()).optional(),

        gajiPokok: z.number().min(0).optional(),
        tunjangan: z.number().min(0).optional(),
        lembur: z.number().min(0).optional(),
        bonus: z.number().min(0).optional(),

        potonganBpjs: z.number().min(0).optional(),
        potonganPph21: z.number().min(0).optional(),
        potonganLainnya: z.number().min(0).optional(),

        keterangan: z.string().optional(),
    }),
});

// Get payroll by ID schema
export const getPayrollByIdSchema = z.object({
    params: z.object({
        id: z.string().cuid('Payroll ID tidak valid'),
    }),
});

// List payrolls schema
export const listPayrollsSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        karyawanId: z.string().cuid().optional(),
        perusahaanId: z.string().cuid().optional(), // Linked via Karyawan -> Perusahaan? No direct link in Penggajian schema, but via Karyawan.
        periode: z.string().regex(/^\d{4}-\d{2}$/).optional(),
        status: z.enum(['PAID', 'UNPAID']).optional(), // Mapped to sudoDibayar
    }),
});

// Pay payroll schema
export const payPayrollSchema = z.object({
    params: z.object({
        id: z.string().cuid('Payroll ID tidak valid'),
    }),
    body: z.object({
        akunKasId: z.string().cuid('Akun Kas ID tidak valid'), // Account to credit (Bank/Cash)
        akunBebanId: z.string().cuid('Akun Beban ID tidak valid').optional(), // Optional override
    }),
});

// Delete payroll schema
export const deletePayrollSchema = z.object({
    params: z.object({
        id: z.string().cuid('Payroll ID tidak valid'),
    }),
});

// TypeScript types
export type CreatePayrollInput = z.infer<typeof createPayrollSchema>['body'];
export type GeneratePayrollInput = z.infer<typeof generatePayrollSchema>['body'];
export type UpdatePayrollInput = {
    params: z.infer<typeof updatePayrollSchema>['params'];
    body: z.infer<typeof updatePayrollSchema>['body'];
};
export type GetPayrollByIdInput = z.infer<typeof getPayrollByIdSchema>['params'];
export type ListPayrollsInput = z.infer<typeof listPayrollsSchema>['query'];
export type PayPayrollInput = {
    params: z.infer<typeof payPayrollSchema>['params'];
    body: z.infer<typeof payPayrollSchema>['body'];
};
export type DeletePayrollInput = z.infer<typeof deletePayrollSchema>['params'];

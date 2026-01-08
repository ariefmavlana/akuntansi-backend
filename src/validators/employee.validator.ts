import { z } from 'zod';

// Create employee schema
export const createEmployeeSchema = z.object({
    body: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        nik: z.string().min(1, 'NIK wajib diisi'),
        nama: z.string().min(1, 'Nama wajib diisi'),
        tempatLahir: z.string().optional(),
        tanggalLahir: z.string().datetime().or(z.date()).optional(),
        jenisKelamin: z.string().optional(),

        alamat: z.string().optional(),
        kota: z.string().optional(),
        telepon: z.string().optional(),
        email: z.string().email('Email tidak valid').optional().or(z.literal('')),

        ktp: z.string().optional(),
        npwp: z.string().optional(),
        bpjsKesehatan: z.string().optional(),
        bpjsKetenagakerjaan: z.string().optional(),

        tanggalMasuk: z.string().datetime().or(z.date()),
        status: z.string().optional().default('AKTIF'),
        statusPtkp: z.string().regex(/^(TK|K|K\/I)\/[0-3]$/, 'Format PTKP tidak valid (contoh: TK/0, K/1)').optional().default('TK/0'),
        departemen: z.string().optional(),
        jabatan: z.string().optional(),
        level: z.string().optional(),

        gajiPokok: z.number().min(0),
        bankNama: z.string().optional(),
        bankRekening: z.string().optional(),

        catatan: z.string().optional(),
    }),
});

// Update employee schema
export const updateEmployeeSchema = z.object({
    params: z.object({
        id: z.string().cuid('Employee ID tidak valid'),
    }),
    body: z.object({
        nik: z.string().min(1).optional(),
        nama: z.string().min(1).optional(),
        tempatLahir: z.string().optional(),
        tanggalLahir: z.string().datetime().or(z.date()).optional(),
        jenisKelamin: z.string().optional(),

        alamat: z.string().optional(),
        kota: z.string().optional(),
        telepon: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),

        ktp: z.string().optional(),
        npwp: z.string().optional(),
        bpjsKesehatan: z.string().optional(),
        bpjsKetenagakerjaan: z.string().optional(),

        tanggalMasuk: z.string().datetime().or(z.date()).optional(),
        tanggalKeluar: z.string().datetime().or(z.date()).optional().nullable(),
        status: z.string().optional(),
        departemen: z.string().optional(),
        jabatan: z.string().optional(),
        level: z.string().optional(),

        gajiPokok: z.number().min(0).optional(),
        bankNama: z.string().optional(),
        bankRekening: z.string().optional(),

        catatan: z.string().optional(),
    }),
});

// Get employee by ID schema
export const getEmployeeByIdSchema = z.object({
    params: z.object({
        id: z.string().cuid('Employee ID tidak valid'),
    }),
});

// List employees schema
export const listEmployeesSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: z.string().cuid().optional(),
        status: z.string().optional(),
        departemen: z.string().optional(),
        search: z.string().optional(),
    }),
});

// Delete employee schema
export const deleteEmployeeSchema = z.object({
    params: z.object({
        id: z.string().cuid('Employee ID tidak valid'),
    }),
});

// TypeScript types
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>['body'];
export type UpdateEmployeeInput = {
    params: z.infer<typeof updateEmployeeSchema>['params'];
    body: z.infer<typeof updateEmployeeSchema>['body'];
};
export type GetEmployeeByIdInput = z.infer<typeof getEmployeeByIdSchema>['params'];
export type ListEmployeesInput = z.infer<typeof listEmployeesSchema>['query'];
export type DeleteEmployeeInput = z.infer<typeof deleteEmployeeSchema>['params'];

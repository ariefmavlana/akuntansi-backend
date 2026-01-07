import { z } from 'zod';
import { TipeAkun, KategoriAset, KategoriLiabilitas, KategoriEkuitas } from '@prisma/client';

// Create COA schema
export const createCoaSchema = z.object({
    body: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        kodeAkun: z
            .string()
            .min(1, 'Kode akun wajib diisi')
            .max(20, 'Kode akun maksimal 20 karakter')
            .regex(/^[0-9.-]+$/, 'Kode akun hanya boleh angka, titik, dan strip'),
        namaAkun: z.string().min(1, 'Nama akun wajib diisi').max(200, 'Nama akun maksimal 200 karakter'),
        tipe: z.nativeEnum(TipeAkun, { errorMap: () => ({ message: 'Tipe akun tidak valid' }) }),
        kategoriAset: z.nativeEnum(KategoriAset).optional(),
        kategoriLiabilitas: z.nativeEnum(KategoriLiabilitas).optional(),
        kategoriEkuitas: z.nativeEnum(KategoriEkuitas).optional(),
        level: z.number().int().min(1).max(10).default(1),
        parentId: z.string().cuid('Parent ID tidak valid').optional(),
        normalBalance: z.enum(['DEBIT', 'KREDIT']).default('DEBIT'),
        isHeader: z.boolean().default(false),
        isActive: z.boolean().default(true),
        isControlAccount: z.boolean().default(false),
        allowManualEntry: z.boolean().default(true),
        requireDepartment: z.boolean().default(false),
        requireProject: z.boolean().default(false),
        requireCostCenter: z.boolean().default(false),
        multiCurrency: z.boolean().default(false),
        mataUangDefault: z.string().optional(),
        saldoAwal: z.number().default(0),
        saldoAwalDebit: z.number().default(0),
        saldoAwalKredit: z.number().default(0),
        pajakId: z.string().cuid().optional(),
        catatan: z.string().optional(),
    }),
});

// Update COA schema
export const updateCoaSchema = z.object({
    params: z.object({
        id: z.string().cuid('COA ID tidak valid'),
    }),
    body: z.object({
        namaAkun: z.string().min(1, 'Nama akun wajib diisi').max(200).optional(),
        kategoriAset: z.nativeEnum(KategoriAset).optional(),
        kategoriLiabilitas: z.nativeEnum(KategoriLiabilitas).optional(),
        kategoriEkuitas: z.nativeEnum(KategoriEkuitas).optional(),
        normalBalance: z.enum(['DEBIT', 'KREDIT']).optional(),
        isActive: z.boolean().optional(),
        isControlAccount: z.boolean().optional(),
        allowManualEntry: z.boolean().optional(),
        requireDepartment: z.boolean().optional(),
        requireProject: z.boolean().optional(),
        requireCostCenter: z.boolean().optional(),
        multiCurrency: z.boolean().optional(),
        mataUangDefault: z.string().optional(),
        saldoAwal: z.number().optional(),
        saldoAwalDebit: z.number().optional(),
        saldoAwalKredit: z.number().optional(),
        pajakId: z.string().cuid().optional().nullable(),
        catatan: z.string().optional(),
    }),
});

// Get COA by ID schema
export const getCoaByIdSchema = z.object({
    params: z.object({
        id: z.string().cuid('COA ID tidak valid'),
    }),
});

// List COA schema
export const listCoaSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('50'),
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid').optional(),
        search: z.string().optional(),
        tipe: z.nativeEnum(TipeAkun).optional(),
        kategoriAset: z.nativeEnum(KategoriAset).optional(),
        kategoriLiabilitas: z.nativeEnum(KategoriLiabilitas).optional(),
        kategoriEkuitas: z.nativeEnum(KategoriEkuitas).optional(),
        parentId: z.string().cuid().optional(),
        level: z.string().regex(/^\d+$/).transform(Number).optional(),
        isHeader: z
            .string()
            .transform((val) => val === 'true')
            .optional(),
        isActive: z
            .string()
            .transform((val) => val === 'true')
            .optional(),
        normalBalance: z.enum(['DEBIT', 'KREDIT']).optional(),
    }),
});

// Delete COA schema
export const deleteCoaSchema = z.object({
    params: z.object({
        id: z.string().cuid('COA ID tidak valid'),
    }),
});

// Get COA hierarchy schema
export const getCoaHierarchySchema = z.object({
    query: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        tipe: z.nativeEnum(TipeAkun).optional(),
        includeInactive: z
            .string()
            .transform((val) => val === 'true')
            .optional()
            .default('false'),
    }),
});

// Update COA balance schema
export const updateCoaBalanceSchema = z.object({
    params: z.object({
        id: z.string().cuid('COA ID tidak valid'),
    }),
    body: z.object({
        saldoAwal: z.number().optional(),
        saldoAwalDebit: z.number().optional(),
        saldoAwalKredit: z.number().optional(),
    }),
});

// TypeScript types
export type CreateCoaInput = z.infer<typeof createCoaSchema>['body'];
export type UpdateCoaInput = {
    params: z.infer<typeof updateCoaSchema>['params'];
    body: z.infer<typeof updateCoaSchema>['body'];
};
export type GetCoaByIdInput = z.infer<typeof getCoaByIdSchema>['params'];
export type ListCoaInput = z.infer<typeof listCoaSchema>['query'];
export type DeleteCoaInput = z.infer<typeof deleteCoaSchema>['params'];
export type GetCoaHierarchyInput = z.infer<typeof getCoaHierarchySchema>['query'];
export type UpdateCoaBalanceInput = {
    params: z.infer<typeof updateCoaBalanceSchema>['params'];
    body: z.infer<typeof updateCoaBalanceSchema>['body'];
};

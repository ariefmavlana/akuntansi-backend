import { z } from 'zod';

/**
 * Budget Validators
 * Validation schemas for budget management
 */

/**
 * Create Budget
 */
export const createBudgetSchema = z.object({
    body: z.object({
        kode: z.string().min(1).max(50),
        nama: z.string().min(1).max(255),
        tahun: z.number().int().min(2000).max(2100),
        tipe: z.enum(['OPERASIONAL', 'MODAL', 'KAS', 'PROYEK', 'DEPARTEMEN']),
        tanggalMulai: z.string().datetime(),
        tanggalAkhir: z.string().datetime(),
        departemen: z.string().optional(),
        projectCode: z.string().optional(),
        deskripsi: z.string().optional(),
        details: z.array(
            z.object({
                akunId: z.string().uuid(),
                bulan: z.number().int().min(1).max(12),
                periode: z.string().datetime(),
                jumlahBudget: z.number().positive(),
                keterangan: z.string().optional(),
            })
        ).min(1),
    }),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>['body'];

/**
 * Update Budget
 */
export const updateBudgetSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        kode: z.string().min(1).max(50).optional(),
        nama: z.string().min(1).max(255).optional(),
        tahun: z.number().int().min(2000).max(2100).optional(),
        tipe: z.enum(['OPERASIONAL', 'MODAL', 'KAS', 'PROYEK', 'DEPARTEMEN']).optional(),
        tanggalMulai: z.string().datetime().optional(),
        tanggalAkhir: z.string().datetime().optional(),
        departemen: z.string().optional().nullable(),
        projectCode: z.string().optional().nullable(),
        deskripsi: z.string().optional().nullable(),
    }),
});

export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>['body'];

/**
 * Approve Budget
 */
export const approveBudgetSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

/**
 * Activate Budget
 */
export const activateBudgetSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

/**
 * Close Budget
 */
export const closeBudgetSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

/**
 * Get Budgets
 */
export const getBudgetsSchema = z.object({
    query: z.object({
        perusahaanId: z.string().uuid().optional(),
        tahun: z.string().transform((val) => parseInt(val)).optional(),
        status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'AKTIF', 'CLOSED', 'REVISED']).optional(),
        tipe: z.enum(['OPERASIONAL', 'MODAL', 'KAS', 'PROYEK', 'DEPARTEMEN']).optional(),
    }),
});

export type GetBudgetsInput = z.infer<typeof getBudgetsSchema>['query'];

/**
 * Add Budget Detail
 */
export const addBudgetDetailSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        akunId: z.string().uuid(),
        bulan: z.number().int().min(1).max(12),
        periode: z.string().datetime(),
        jumlahBudget: z.number().positive(),
        keterangan: z.string().optional(),
    }),
});

export type AddBudgetDetailInput = z.infer<typeof addBudgetDetailSchema>['body'];

/**
 * Update Budget Detail
 */
export const updateBudgetDetailSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
        detailId: z.string().uuid(),
    }),
    body: z.object({
        jumlahBudget: z.number().positive().optional(),
        keterangan: z.string().optional().nullable(),
    }),
});

export type UpdateBudgetDetailInput = z.infer<typeof updateBudgetDetailSchema>['body'];

/**
 * Delete Budget Detail
 */
export const deleteBudgetDetailSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
        detailId: z.string().uuid(),
    }),
});

/**
 * Create Budget Revision
 */
export const createBudgetRevisionSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        alasanRevisi: z.string().min(10),
        jumlahSebelum: z.number(),
        jumlahSesudah: z.number(),
        catatan: z.string().optional(),
    }),
});

export type CreateBudgetRevisionInput = z.infer<typeof createBudgetRevisionSchema>['body'];

/**
 * Get Budget vs Actual
 */
export const getBudgetVsActualSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    query: z.object({
        bulan: z.string().transform((val) => parseInt(val)).optional(),
    }),
});

/**
 * Get Budget vs Actual Analysis (company-wide)
 */
export const getBudgetVsActualAnalysisSchema = z.object({
    query: z.object({
        perusahaanId: z.string().uuid().optional(),
        tahun: z.string().transform((val) => parseInt(val)),
        bulan: z.string().transform((val) => parseInt(val)).optional(),
    }),
});

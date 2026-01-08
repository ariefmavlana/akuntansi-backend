import { z } from 'zod';

/**
 * Cost Center Validators
 * Validation schemas for cost center management
 */

/**
 * Create Cost Center
 */
export const createCostCenterSchema = z.object({
    body: z.object({
        kode: z.string().min(1).max(50),
        nama: z.string().min(1).max(255),
        deskripsi: z.string().optional(),
        parentId: z.string().uuid().optional(),
        manager: z.string().max(255).optional(),
    }),
});

export type CreateCostCenterInput = z.infer<typeof createCostCenterSchema>['body'];

/**
 * Update Cost Center
 */
export const updateCostCenterSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        kode: z.string().min(1).max(50).optional(),
        nama: z.string().min(1).max(255).optional(),
        deskripsi: z.string().optional().nullable(),
        parentId: z.string().uuid().optional().nullable(),
        manager: z.string().max(255).optional().nullable(),
        isAktif: z.boolean().optional(),
    }),
});

export type UpdateCostCenterInput = z.infer<typeof updateCostCenterSchema>['body'];

/**
 * Get Cost Centers
 */
export const getCostCentersSchema = z.object({
    query: z.object({
        perusahaanId: z.string().uuid().optional(),
        isAktif: z.string().transform((val) => val === 'true').optional(),
        search: z.string().optional(),
        parentId: z.string().uuid().optional(),
    }),
});

export type GetCostCentersInput = z.infer<typeof getCostCentersSchema>['query'];

/**
 * Get Cost Center By ID
 */
export const getCostCenterByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

/**
 * Delete Cost Center
 */
export const deleteCostCenterSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

/**
 * Get Cost Center Transactions
 */
export const getCostCenterTransactionsSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    query: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    }),
});

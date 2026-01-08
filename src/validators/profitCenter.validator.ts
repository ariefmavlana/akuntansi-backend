import { z } from 'zod';

/**
 * Profit Center Validators
 * Validation schemas for profit center management
 */

/**
 * Create Profit Center
 */
export const createProfitCenterSchema = z.object({
    body: z.object({
        kode: z.string().min(1).max(50),
        nama: z.string().min(1).max(255),
        deskripsi: z.string().optional(),
        parentId: z.string().uuid().optional(),
        manager: z.string().max(255).optional(),
    }),
});

export type CreateProfitCenterInput = z.infer<typeof createProfitCenterSchema>['body'];

/**
 * Update Profit Center
 */
export const updateProfitCenterSchema = z.object({
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

export type UpdateProfitCenterInput = z.infer<typeof updateProfitCenterSchema>['body'];

/**
 * Get Profit Centers
 */
export const getProfitCentersSchema = z.object({
    query: z.object({
        perusahaanId: z.string().uuid().optional(),
        isAktif: z.string().transform((val) => val === 'true').optional(),
        search: z.string().optional(),
        parentId: z.string().uuid().optional(),
    }),
});

export type GetProfitCentersInput = z.infer<typeof getProfitCentersSchema>['query'];

/**
 * Get Profit Center By ID
 */
export const getProfitCenterByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

/**
 * Delete Profit Center
 */
export const deleteProfitCenterSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

/**
 * Get Profit Center Performance
 */
export const getProfitCenterPerformanceSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    query: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    }),
});

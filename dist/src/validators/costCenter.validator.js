"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCostCenterTransactionsSchema = exports.deleteCostCenterSchema = exports.getCostCenterByIdSchema = exports.getCostCentersSchema = exports.updateCostCenterSchema = exports.createCostCenterSchema = void 0;
const zod_1 = require("zod");
/**
 * Cost Center Validators
 * Validation schemas for cost center management
 */
/**
 * Create Cost Center
 */
exports.createCostCenterSchema = zod_1.z.object({
    body: zod_1.z.object({
        kode: zod_1.z.string().min(1).max(50),
        nama: zod_1.z.string().min(1).max(255),
        deskripsi: zod_1.z.string().optional(),
        parentId: zod_1.z.string().uuid().optional(),
        manager: zod_1.z.string().max(255).optional(),
    }),
});
/**
 * Update Cost Center
 */
exports.updateCostCenterSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        kode: zod_1.z.string().min(1).max(50).optional(),
        nama: zod_1.z.string().min(1).max(255).optional(),
        deskripsi: zod_1.z.string().optional().nullable(),
        parentId: zod_1.z.string().uuid().optional().nullable(),
        manager: zod_1.z.string().max(255).optional().nullable(),
        isAktif: zod_1.z.boolean().optional(),
    }),
});
/**
 * Get Cost Centers
 */
exports.getCostCentersSchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().uuid().optional(),
        isAktif: zod_1.z.string().transform((val) => val === 'true').optional(),
        search: zod_1.z.string().optional(),
        parentId: zod_1.z.string().uuid().optional(),
    }),
});
/**
 * Get Cost Center By ID
 */
exports.getCostCenterByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
/**
 * Delete Cost Center
 */
exports.deleteCostCenterSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
/**
 * Get Cost Center Transactions
 */
exports.getCostCenterTransactionsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    query: zod_1.z.object({
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
    }),
});

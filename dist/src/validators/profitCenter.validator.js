"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfitCenterPerformanceSchema = exports.deleteProfitCenterSchema = exports.getProfitCenterByIdSchema = exports.getProfitCentersSchema = exports.updateProfitCenterSchema = exports.createProfitCenterSchema = void 0;
const zod_1 = require("zod");
/**
 * Profit Center Validators
 * Validation schemas for profit center management
 */
/**
 * Create Profit Center
 */
exports.createProfitCenterSchema = zod_1.z.object({
    body: zod_1.z.object({
        kode: zod_1.z.string().min(1).max(50),
        nama: zod_1.z.string().min(1).max(255),
        deskripsi: zod_1.z.string().optional(),
        parentId: zod_1.z.string().uuid().optional(),
        manager: zod_1.z.string().max(255).optional(),
    }),
});
/**
 * Update Profit Center
 */
exports.updateProfitCenterSchema = zod_1.z.object({
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
 * Get Profit Centers
 */
exports.getProfitCentersSchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().uuid().optional(),
        isAktif: zod_1.z.string().transform((val) => val === 'true').optional(),
        search: zod_1.z.string().optional(),
        parentId: zod_1.z.string().uuid().optional(),
    }),
});
/**
 * Get Profit Center By ID
 */
exports.getProfitCenterByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
/**
 * Delete Profit Center
 */
exports.deleteProfitCenterSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
/**
 * Get Profit Center Performance
 */
exports.getProfitCenterPerformanceSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    query: zod_1.z.object({
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
    }),
});

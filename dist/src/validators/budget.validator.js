"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBudgetVsActualAnalysisSchema = exports.getBudgetVsActualSchema = exports.createBudgetRevisionSchema = exports.deleteBudgetDetailSchema = exports.updateBudgetDetailSchema = exports.addBudgetDetailSchema = exports.getBudgetsSchema = exports.closeBudgetSchema = exports.activateBudgetSchema = exports.approveBudgetSchema = exports.updateBudgetSchema = exports.createBudgetSchema = void 0;
const zod_1 = require("zod");
/**
 * Budget Validators
 * Validation schemas for budget management
 */
/**
 * Create Budget
 */
exports.createBudgetSchema = zod_1.z.object({
    body: zod_1.z.object({
        kode: zod_1.z.string().min(1).max(50),
        nama: zod_1.z.string().min(1).max(255),
        tahun: zod_1.z.number().int().min(2000).max(2100),
        tipe: zod_1.z.enum(['OPERASIONAL', 'MODAL', 'KAS', 'PROYEK', 'DEPARTEMEN']),
        tanggalMulai: zod_1.z.string().datetime(),
        tanggalAkhir: zod_1.z.string().datetime(),
        departemen: zod_1.z.string().optional(),
        projectCode: zod_1.z.string().optional(),
        deskripsi: zod_1.z.string().optional(),
        details: zod_1.z.array(zod_1.z.object({
            akunId: zod_1.z.string().uuid(),
            bulan: zod_1.z.number().int().min(1).max(12),
            periode: zod_1.z.string().datetime(),
            jumlahBudget: zod_1.z.number().positive(),
            keterangan: zod_1.z.string().optional(),
        })).min(1),
    }),
});
/**
 * Update Budget
 */
exports.updateBudgetSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        kode: zod_1.z.string().min(1).max(50).optional(),
        nama: zod_1.z.string().min(1).max(255).optional(),
        tahun: zod_1.z.number().int().min(2000).max(2100).optional(),
        tipe: zod_1.z.enum(['OPERASIONAL', 'MODAL', 'KAS', 'PROYEK', 'DEPARTEMEN']).optional(),
        tanggalMulai: zod_1.z.string().datetime().optional(),
        tanggalAkhir: zod_1.z.string().datetime().optional(),
        departemen: zod_1.z.string().optional().nullable(),
        projectCode: zod_1.z.string().optional().nullable(),
        deskripsi: zod_1.z.string().optional().nullable(),
    }),
});
/**
 * Approve Budget
 */
exports.approveBudgetSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
/**
 * Activate Budget
 */
exports.activateBudgetSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
/**
 * Close Budget
 */
exports.closeBudgetSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
});
/**
 * Get Budgets
 */
exports.getBudgetsSchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().uuid().optional(),
        tahun: zod_1.z.string().transform((val) => parseInt(val)).optional(),
        status: zod_1.z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'AKTIF', 'CLOSED', 'REVISED']).optional(),
        tipe: zod_1.z.enum(['OPERASIONAL', 'MODAL', 'KAS', 'PROYEK', 'DEPARTEMEN']).optional(),
    }),
});
/**
 * Add Budget Detail
 */
exports.addBudgetDetailSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        akunId: zod_1.z.string().uuid(),
        bulan: zod_1.z.number().int().min(1).max(12),
        periode: zod_1.z.string().datetime(),
        jumlahBudget: zod_1.z.number().positive(),
        keterangan: zod_1.z.string().optional(),
    }),
});
/**
 * Update Budget Detail
 */
exports.updateBudgetDetailSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        detailId: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        jumlahBudget: zod_1.z.number().positive().optional(),
        keterangan: zod_1.z.string().optional().nullable(),
    }),
});
/**
 * Delete Budget Detail
 */
exports.deleteBudgetDetailSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        detailId: zod_1.z.string().uuid(),
    }),
});
/**
 * Create Budget Revision
 */
exports.createBudgetRevisionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        alasanRevisi: zod_1.z.string().min(10),
        jumlahSebelum: zod_1.z.number(),
        jumlahSesudah: zod_1.z.number(),
        catatan: zod_1.z.string().optional(),
    }),
});
/**
 * Get Budget vs Actual
 */
exports.getBudgetVsActualSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    query: zod_1.z.object({
        bulan: zod_1.z.string().transform((val) => parseInt(val)).optional(),
    }),
});
/**
 * Get Budget vs Actual Analysis (company-wide)
 */
exports.getBudgetVsActualAnalysisSchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().uuid().optional(),
        tahun: zod_1.z.string().transform((val) => parseInt(val)),
        bulan: zod_1.z.string().transform((val) => parseInt(val)).optional(),
    }),
});

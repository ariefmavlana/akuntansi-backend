"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApprovalsSchema = exports.processApprovalSchema = exports.submitForApprovalSchema = exports.updateApprovalTemplateSchema = exports.createApprovalTemplateSchema = void 0;
const zod_1 = require("zod");
/**
 * Approval Workflow Validators
 */
// Create Approval Template
exports.createApprovalTemplateSchema = zod_1.z.object({
    body: zod_1.z.object({
        modul: zod_1.z.enum(['VOUCHER', 'INVOICE', 'PAYMENT', 'PURCHASE_ORDER', 'BUDGET']),
        nama: zod_1.z.string().min(1).max(255),
        deskripsi: zod_1.z.string().optional(),
        rules: zod_1.z.record(zod_1.z.any()).optional(), // JSON rules
        isDefault: zod_1.z.boolean().optional(),
        levels: zod_1.z.array(zod_1.z.object({
            level: zod_1.z.number().int().positive(),
            nama: zod_1.z.string().min(1),
            approverRoles: zod_1.z.array(zod_1.z.string()).min(1),
            minApprover: zod_1.z.number().int().positive().default(1),
            isParalel: zod_1.z.boolean().optional(),
            timeoutHari: zod_1.z.number().int().positive().optional(),
        })).min(1),
    }),
});
// Update Approval Template
exports.updateApprovalTemplateSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        nama: zod_1.z.string().min(1).max(255).optional(),
        deskripsi: zod_1.z.string().optional().nullable(),
        rules: zod_1.z.record(zod_1.z.any()).optional(),
        isAktif: zod_1.z.boolean().optional(),
        isDefault: zod_1.z.boolean().optional(),
    }),
});
// Submit for Approval
exports.submitForApprovalSchema = zod_1.z.object({
    body: zod_1.z.object({
        modul: zod_1.z.enum(['VOUCHER', 'INVOICE', 'PAYMENT', 'PURCHASE_ORDER', 'BUDGET']),
        recordId: zod_1.z.string().uuid(),
        templateId: zod_1.z.string().uuid().optional(), // Auto-select if not provided
    }),
});
// Approve/Reject
exports.processApprovalSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        action: zod_1.z.enum(['APPROVE', 'REJECT']),
        catatan: zod_1.z.string().optional(),
    }),
});
// Get Approvals
exports.getApprovalsSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
        modul: zod_1.z.string().optional(),
        approverId: zod_1.z.string().uuid().optional(),
    }),
});

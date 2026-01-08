import { z } from 'zod';

/**
 * Approval Workflow Validators
 */

// Create Approval Template
export const createApprovalTemplateSchema = z.object({
    body: z.object({
        modul: z.enum(['VOUCHER', 'INVOICE', 'PAYMENT', 'PURCHASE_ORDER', 'BUDGET']),
        nama: z.string().min(1).max(255),
        deskripsi: z.string().optional(),
        rules: z.record(z.any()).optional(), // JSON rules
        isDefault: z.boolean().optional(),
        levels: z.array(
            z.object({
                level: z.number().int().positive(),
                nama: z.string().min(1),
                approverRoles: z.array(z.string()).min(1),
                minApprover: z.number().int().positive().default(1),
                isParalel: z.boolean().optional(),
                timeoutHari: z.number().int().positive().optional(),
            })
        ).min(1),
    }),
});

export type CreateApprovalTemplateInput = z.infer<typeof createApprovalTemplateSchema>['body'];

// Update Approval Template
export const updateApprovalTemplateSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        nama: z.string().min(1).max(255).optional(),
        deskripsi: z.string().optional().nullable(),
        rules: z.record(z.any()).optional(),
        isAktif: z.boolean().optional(),
        isDefault: z.boolean().optional(),
    }),
});

// Submit for Approval
export const submitForApprovalSchema = z.object({
    body: z.object({
        modul: z.enum(['VOUCHER', 'INVOICE', 'PAYMENT', 'PURCHASE_ORDER', 'BUDGET']),
        recordId: z.string().uuid(),
        templateId: z.string().uuid().optional(), // Auto-select if not provided
    }),
});

export type SubmitForApprovalInput = z.infer<typeof submitForApprovalSchema>['body'];

// Approve/Reject
export const processApprovalSchema = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        action: z.enum(['APPROVE', 'REJECT']),
        catatan: z.string().optional(),
    }),
});

export type ProcessApprovalInput = z.infer<typeof processApprovalSchema>['body'];

// Get Approvals
export const getApprovalsSchema = z.object({
    query: z.object({
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
        modul: z.string().optional(),
        approverId: z.string().uuid().optional(),
    }),
});

export type GetApprovalsInput = z.infer<typeof getApprovalsSchema>['query'];

import { z } from 'zod';

// Get audit logs
export const getAuditLogsSchema = z.object({
    query: z.object({
        perusahaanId: z.string().cuid(),
        penggunaId: z.string().cuid().optional(),
        modul: z.string().optional(),
        subModul: z.string().optional(),
        aksi: z.string().optional(), // CREATE, UPDATE, DELETE, VIEW, APPROVE, POST
        namaTabel: z.string().optional(),
        idData: z.string().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});

// Get single audit log
export const getAuditLogSchema = z.object({
    params: z.object({
        id: z.string().cuid(),
    }),
});

// Get audit logs by data record
export const getAuditByRecordSchema = z.object({
    query: z.object({
        namaTabel: z.string(),
        idData: z.string(),
    }),
});

// Get user activity
export const getUserActivitySchema = z.object({
    params: z.object({
        userId: z.string().cuid(),
    }),
    query: z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});

// Type exports
export type GetAuditLogsInput = z.infer<typeof getAuditLogsSchema>['query'];
export type GetAuditByRecordInput = z.infer<typeof getAuditByRecordSchema>['query'];
export type GetUserActivityInput = {
    userId: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
};

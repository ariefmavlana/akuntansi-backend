"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserActivitySchema = exports.getAuditByRecordSchema = exports.getAuditLogSchema = exports.getAuditLogsSchema = void 0;
const zod_1 = require("zod");
// Get audit logs
exports.getAuditLogsSchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid(),
        penggunaId: zod_1.z.string().cuid().optional(),
        modul: zod_1.z.string().optional(),
        subModul: zod_1.z.string().optional(),
        aksi: zod_1.z.string().optional(), // CREATE, UPDATE, DELETE, VIEW, APPROVE, POST
        namaTabel: zod_1.z.string().optional(),
        idData: zod_1.z.string().optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});
// Get single audit log
exports.getAuditLogSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid(),
    }),
});
// Get audit logs by data record
exports.getAuditByRecordSchema = zod_1.z.object({
    query: zod_1.z.object({
        namaTabel: zod_1.z.string(),
        idData: zod_1.z.string(),
    }),
});
// Get user activity
exports.getUserActivitySchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().cuid(),
    }),
    query: zod_1.z.object({
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});

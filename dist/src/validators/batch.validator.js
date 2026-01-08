"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchDeleteSchema = exports.batchPostJournalsSchema = exports.batchApprovalsSchema = exports.batchTransactionsSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// Batch create transactions
exports.batchTransactionsSchema = zod_1.z.object({
    body: zod_1.z.object({
        transactions: zod_1.z.array(zod_1.z.object({
            perusahaanId: zod_1.z.string().cuid(),
            tipe: zod_1.z.nativeEnum(client_1.TipeTransaksi),
            mataUangId: zod_1.z.string().cuid(),
            tanggal: zod_1.z.string().datetime(),
            total: zod_1.z.number().positive(),
            pelangganId: zod_1.z.string().cuid().optional(),
            pemasokId: zod_1.z.string().cuid().optional(),
            referensi: zod_1.z.string().optional(),
            deskripsi: zod_1.z.string().optional(),
            costCenterId: zod_1.z.string().cuid().optional(),
            profitCenterId: zod_1.z.string().cuid().optional(),
            details: zod_1.z.array(zod_1.z.object({
                akunId: zod_1.z.string().cuid(),
                deskripsi: zod_1.z.string(),
                kuantitas: zod_1.z.number().default(1),
                hargaSatuan: zod_1.z.number(),
                debit: zod_1.z.number().default(0),
                kredit: zod_1.z.number().default(0),
            })).min(1),
        })).min(1).max(100), // Limit to 100 transactions per batch
    }),
});
// Batch process approvals
exports.batchApprovalsSchema = zod_1.z.object({
    body: zod_1.z.object({
        approvalIds: zod_1.z.array(zod_1.z.string().cuid()).min(1).max(50),
        action: zod_1.z.enum(['APPROVE', 'REJECT']),
        catatan: zod_1.z.string().optional(),
    }),
});
// Batch post journals
exports.batchPostJournalsSchema = zod_1.z.object({
    body: zod_1.z.object({
        jurnalIds: zod_1.z.array(zod_1.z.string().cuid()).min(1).max(100),
    }),
});
// Batch delete
exports.batchDeleteSchema = zod_1.z.object({
    body: zod_1.z.object({
        entityType: zod_1.z.enum(['TRANSAKSI', 'VOUCHER', 'JURNAL', 'DOKUMEN']),
        ids: zod_1.z.array(zod_1.z.string().cuid()).min(1).max(100),
        force: zod_1.z.boolean().default(false), // Force delete even with dependencies
    }),
});

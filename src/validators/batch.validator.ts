import { z } from 'zod';
import { TipeTransaksi, StatusApproval } from '@prisma/client';

// Batch create transactions
export const batchTransactionsSchema = z.object({
    body: z.object({
        transactions: z.array(
            z.object({
                perusahaanId: z.string().cuid(),
                tipe: z.nativeEnum(TipeTransaksi),
                mataUangId: z.string().cuid(),
                tanggal: z.string().datetime(),
                total: z.number().positive(),
                pelangganId: z.string().cuid().optional(),
                pemasokId: z.string().cuid().optional(),
                referensi: z.string().optional(),
                deskripsi: z.string().optional(),
                costCenterId: z.string().cuid().optional(),
                profitCenterId: z.string().cuid().optional(),
                details: z.array(
                    z.object({
                        akunId: z.string().cuid(),
                        deskripsi: z.string(),
                        kuantitas: z.number().default(1),
                        hargaSatuan: z.number(),
                        debit: z.number().default(0),
                        kredit: z.number().default(0),
                    })
                ).min(1),
            })
        ).min(1).max(100), // Limit to 100 transactions per batch
    }),
});

// Batch process approvals
export const batchApprovalsSchema = z.object({
    body: z.object({
        approvalIds: z.array(z.string().cuid()).min(1).max(50),
        action: z.enum(['APPROVE', 'REJECT']),
        catatan: z.string().optional(),
    }),
});

// Batch post journals
export const batchPostJournalsSchema = z.object({
    body: z.object({
        jurnalIds: z.array(z.string().cuid()).min(1).max(100),
    }),
});

// Batch delete
export const batchDeleteSchema = z.object({
    body: z.object({
        entityType: z.enum(['TRANSAKSI', 'VOUCHER', 'JURNAL', 'DOKUMEN']),
        ids: z.array(z.string().cuid()).min(1).max(100),
        force: z.boolean().default(false), // Force delete even with dependencies
    }),
});

// Type exports
export type BatchTransactionsInput = z.infer<typeof batchTransactionsSchema>['body'];
export type BatchApprovalsInput = z.infer<typeof batchApprovalsSchema>['body'];
export type BatchPostJournalsInput = z.infer<typeof batchPostJournalsSchema>['body'];
export type BatchDeleteInput = z.infer<typeof batchDeleteSchema>['body'];

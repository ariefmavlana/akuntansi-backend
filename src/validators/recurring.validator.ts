import { z } from 'zod';
import { TipeTransaksi, FrekuensiRekuren } from '@prisma/client';

// Create recurring transaction
export const createRecurringTransactionSchema = z.object({
    body: z.object({
        perusahaanId: z.string().cuid(),
        nama: z.string().min(3, 'Nama minimal 3 karakter'),
        deskripsi: z.string().optional(),
        tipeTransaksi: z.nativeEnum(TipeTransaksi),
        frekuensi: z.nativeEnum(FrekuensiRekuren),
        intervalHari: z.number().int().positive().optional(), // For CUSTOM frequency
        tanggalMulai: z.string().datetime().or(z.date()),
        tanggalBerakhir: z.string().datetime().or(z.date()).optional(),
        jumlahOkurensi: z.number().int().positive().optional(), // Alternative to tanggalBerakhir
        template: z.object({
            mataUangId: z.string().cuid().optional(),
            pelangganId: z.string().cuid().optional(),
            pemasokId: z.string().cuid().optional(),
            referensi: z.string().optional(),
            costCenterId: z.string().cuid().optional(),
            profitCenterId: z.string().cuid().optional(),
            details: z.array(z.object({
                akunId: z.string().cuid(),
                deskripsi: z.string().optional(),
                debit: z.number().nonnegative(),
                kredit: z.number().nonnegative(),
            })).min(2, 'Minimal2 detail entry (debit & kredit)'),
        }),
        isAktif: z.boolean().default(true),
    }),
});

// Update recurring transaction
export const updateRecurringTransactionSchema = z.object({
    params: z.object({
        id: z.string().cuid(),
    }),
    body: z.object({
        nama: z.string().min(3).optional(),
        deskripsi: z.string().optional(),
        frekuensi: z.nativeEnum(FrekuensiRekuren).optional(),
        intervalHari: z.number().int().positive().optional(),
        tanggalMulai: z.string().datetime().or(z.date()).optional(),
        tanggalBerakhir: z.string().datetime().or(z.date()).optional(),
        jumlahOkurensi: z.number().int().positive().optional(),
        template: z.object({
            mataUangId: z.string().cuid().optional(),
            pelangganId: z.string().cuid().optional(),
            pemasokId: z.string().cuid().optional(),
            referensi: z.string().optional(),
            costCenterId: z.string().cuid().optional(),
            profitCenterId: z.string().cuid().optional(),
            details: z.array(z.object({
                akunId: z.string().cuid(),
                deskripsi: z.string().optional(),
                debit: z.number().nonnegative(),
                kredit: z.number().nonnegative(),
            })).min(2).optional(),
        }).optional(),
        isAktif: z.boolean().optional(),
    }),
});

// Get recurring transactions
export const getRecurringTransactionsSchema = z.object({
    query: z.object({
        perusahaanId: z.string().cuid(),
        tipeTransaksi: z.nativeEnum(TipeTransaksi).optional(),
        frekuensi: z.nativeEnum(FrekuensiRekuren).optional(),
        isAktif: z.enum(['true', 'false']).optional(),
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});

// Execute recurring transaction now
export const executeRecurringTransactionSchema = z.object({
    params: z.object({
        id: z.string().cuid(),
    }),
});

// Get recurring transaction history
export const getRecurringHistorySchema = z.object({
    params: z.object({
        id: z.string().cuid(),
    }),
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});

// Type exports
export type CreateRecurringTransactionInput = z.infer<typeof createRecurringTransactionSchema>['body'];
export type UpdateRecurringTransactionInput = z.infer<typeof updateRecurringTransactionSchema>['body'];
export type GetRecurringTransactionsInput = z.infer<typeof getRecurringTransactionsSchema>['query'];

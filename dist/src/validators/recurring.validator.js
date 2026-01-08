"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecurringHistorySchema = exports.executeRecurringTransactionSchema = exports.getRecurringTransactionsSchema = exports.updateRecurringTransactionSchema = exports.createRecurringTransactionSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// Create recurring transaction
exports.createRecurringTransactionSchema = zod_1.z.object({
    body: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid(),
        nama: zod_1.z.string().min(3, 'Nama minimal 3 karakter'),
        deskripsi: zod_1.z.string().optional(),
        tipeTransaksi: zod_1.z.nativeEnum(client_1.TipeTransaksi),
        frekuensi: zod_1.z.nativeEnum(client_1.FrekuensiRekuren),
        intervalHari: zod_1.z.number().int().positive().optional(), // For CUSTOM frequency
        tanggalMulai: zod_1.z.string().datetime().or(zod_1.z.date()),
        tanggalBerakhir: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        jumlahOkurensi: zod_1.z.number().int().positive().optional(), // Alternative to tanggalBerakhir
        template: zod_1.z.object({
            mataUangId: zod_1.z.string().cuid().optional(),
            pelangganId: zod_1.z.string().cuid().optional(),
            pemasokId: zod_1.z.string().cuid().optional(),
            referensi: zod_1.z.string().optional(),
            costCenterId: zod_1.z.string().cuid().optional(),
            profitCenterId: zod_1.z.string().cuid().optional(),
            details: zod_1.z.array(zod_1.z.object({
                akunId: zod_1.z.string().cuid(),
                deskripsi: zod_1.z.string().optional(),
                debit: zod_1.z.number().nonnegative(),
                kredit: zod_1.z.number().nonnegative(),
            })).min(2, 'Minimal2 detail entry (debit & kredit)'),
        }),
        isAktif: zod_1.z.boolean().default(true),
    }),
});
// Update recurring transaction
exports.updateRecurringTransactionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid(),
    }),
    body: zod_1.z.object({
        nama: zod_1.z.string().min(3).optional(),
        deskripsi: zod_1.z.string().optional(),
        frekuensi: zod_1.z.nativeEnum(client_1.FrekuensiRekuren).optional(),
        intervalHari: zod_1.z.number().int().positive().optional(),
        tanggalMulai: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        tanggalBerakhir: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        jumlahOkurensi: zod_1.z.number().int().positive().optional(),
        template: zod_1.z.object({
            mataUangId: zod_1.z.string().cuid().optional(),
            pelangganId: zod_1.z.string().cuid().optional(),
            pemasokId: zod_1.z.string().cuid().optional(),
            referensi: zod_1.z.string().optional(),
            costCenterId: zod_1.z.string().cuid().optional(),
            profitCenterId: zod_1.z.string().cuid().optional(),
            details: zod_1.z.array(zod_1.z.object({
                akunId: zod_1.z.string().cuid(),
                deskripsi: zod_1.z.string().optional(),
                debit: zod_1.z.number().nonnegative(),
                kredit: zod_1.z.number().nonnegative(),
            })).min(2).optional(),
        }).optional(),
        isAktif: zod_1.z.boolean().optional(),
    }),
});
// Get recurring transactions
exports.getRecurringTransactionsSchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid(),
        tipeTransaksi: zod_1.z.nativeEnum(client_1.TipeTransaksi).optional(),
        frekuensi: zod_1.z.nativeEnum(client_1.FrekuensiRekuren).optional(),
        isAktif: zod_1.z.enum(['true', 'false']).optional(),
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});
// Execute recurring transaction now
exports.executeRecurringTransactionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid(),
    }),
});
// Get recurring transaction history
exports.getRecurringHistorySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid(),
    }),
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});

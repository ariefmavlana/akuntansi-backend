import { z } from 'zod';
import { TipeTransaksi, StatusPembayaran, TipePembayaran } from '@prisma/client';

// Transaction detail schema (for nested creation)
const transactionDetailSchema = z.object({
    urutan: z.number().int().min(1),
    akunId: z.string().cuid('Akun ID tidak valid'),
    deskripsi: z.string().optional(),
    kuantitas: z.number().min(0).default(1),
    hargaSatuan: z.number().min(0).default(0),
    diskon: z.number().min(0).max(100).default(0),
    subtotal: z.number().min(0),
    persediaanId: z.string().cuid().optional(),
    asetTetapId: z.string().cuid().optional(),
    catatan: z.string().optional(),
});

// Create transaction schema
export const createTransactionSchema = z.object({
    body: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        cabangId: z.string().cuid('Cabang ID tidak valid').optional(),
        periodeId: z.string().cuid('Periode ID tidak valid'),
        tipe: z.nativeEnum(TipeTransaksi, { errorMap: () => ({ message: 'Tipe transaksi tidak valid' }) }),
        nomorTransaksi: z.string().min(1, 'Nomor transaksi wajib diisi').optional(), // Auto-generated if not provided
        tanggal: z.string().datetime('Format tanggal tidak valid').or(z.date()),
        tanggalJatuhTempo: z.string().datetime().or(z.date()).optional(),

        // Related entities
        pelangganId: z.string().cuid().optional(),
        supplierId: z.string().cuid().optional(),
        proyekId: z.string().cuid().optional(),
        departemenId: z.string().cuid().optional(),

        // Amounts
        subtotal: z.number().min(0),
        diskon: z.number().min(0).default(0),
        pajakId: z.string().cuid().optional(),
        jumlahPajak: z.number().min(0).default(0),
        biayaLain: z.number().min(0).default(0),
        total: z.number().min(0),

        // Multi-currency
        mataUang: z.string().default('IDR'),
        kurs: z.number().min(0).default(1),
        totalAsli: z.number().min(0).optional(),

        // Description and notes
        deskripsi: z.string().min(1, 'Deskripsi wajib diisi'),
        catatan: z.string().optional(),
        referensi: z.string().optional(),

        // Transaction details (line items)
        detail: z.array(transactionDetailSchema).min(1, 'Minimal 1 detail transaksi diperlukan'),
    }),
});

// Update transaction schema (only for DRAFT status)
export const updateTransactionSchema = z.object({
    params: z.object({
        id: z.string().cuid('Transaction ID tidak valid'),
    }),
    body: z.object({
        tanggal: z.string().datetime().or(z.date()).optional(),
        tanggalJatuhTempo: z.string().datetime().or(z.date()).optional(),
        pelangganId: z.string().cuid().optional().nullable(),
        supplierId: z.string().cuid().optional().nullable(),
        proyekId: z.string().cuid().optional().nullable(),
        departemenId: z.string().cuid().optional().nullable(),
        subtotal: z.number().min(0).optional(),
        diskon: z.number().min(0).optional(),
        pajakId: z.string().cuid().optional().nullable(),
        jumlahPajak: z.number().min(0).optional(),
        biayaLain: z.number().min(0).optional(),
        total: z.number().min(0).optional(),
        deskripsi: z.string().min(1).optional(),
        catatan: z.string().optional(),
        referensi: z.string().optional(),
        detail: z.array(transactionDetailSchema).min(1).optional(),
    }),
});

// Get transaction by ID schema
export const getTransactionByIdSchema = z.object({
    params: z.object({
        id: z.string().cuid('Transaction ID tidak valid'),
    }),
});

// List transactions schema
export const listTransactionsSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: z.string().cuid().optional(),
        cabangId: z.string().cuid().optional(),
        periodeId: z.string().cuid().optional(),
        tipe: z.nativeEnum(TipeTransaksi).optional(),
        statusPembayaran: z.nativeEnum(StatusPembayaran).optional(),
        pelangganId: z.string().cuid().optional(),
        supplierId: z.string().cuid().optional(),
        search: z.string().optional(),
        tanggalMulai: z.string().datetime().or(z.date()).optional(),
        tanggalAkhir: z.string().datetime().or(z.date()).optional(),
        isPosted: z
            .string()
            .transform((val) => val === 'true')
            .optional(),
    }),
});

// Post transaction schema
export const postTransactionSchema = z.object({
    params: z.object({
        id: z.string().cuid('Transaction ID tidak valid'),
    }),
    body: z.object({
        tanggalPosting: z.string().datetime().or(z.date()).optional(),
    }),
});

// Void transaction schema
export const voidTransactionSchema = z.object({
    params: z.object({
        id: z.string().cuid('Transaction ID tidak valid'),
    }),
    body: z.object({
        alasan: z.string().min(1, 'Alasan void wajib diisi'),
    }),
});

// Delete transaction schema
export const deleteTransactionSchema = z.object({
    params: z.object({
        id: z.string().cuid('Transaction ID tidak valid'),
    }),
});

// Payment schema
const paymentSchema = z.object({
    nomorPembayaran: z.string().optional(), // Auto-generated if not provided
    tanggal: z.string().datetime().or(z.date()),
    tipePembayaran: z.nativeEnum(TipePembayaran),
    jumlah: z.number().min(0),
    bankRekeningId: z.string().cuid().optional(),
    nomorReferensi: z.string().optional(),
    kurs: z.number().min(0).optional(),
    jumlahAsli: z.number().min(0).optional(),
    biayaAdmin: z.number().min(0).default(0),
    keterangan: z.string().optional(),
});

// Add payment to transaction
export const addPaymentSchema = z.object({
    params: z.object({
        id: z.string().cuid('Transaction ID tidak valid'),
    }),
    body: paymentSchema,
});

// TypeScript types
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>['body'];
export type UpdateTransactionInput = {
    params: z.infer<typeof updateTransactionSchema>['params'];
    body: z.infer<typeof updateTransactionSchema>['body'];
};
export type GetTransactionByIdInput = z.infer<typeof getTransactionByIdSchema>['params'];
export type ListTransactionsInput = z.infer<typeof listTransactionsSchema>['query'];
export type PostTransactionInput = {
    params: z.infer<typeof postTransactionSchema>['params'];
    body: z.infer<typeof postTransactionSchema>['body'];
};
export type VoidTransactionInput = {
    params: z.infer<typeof voidTransactionSchema>['params'];
    body: z.infer<typeof voidTransactionSchema>['body'];
};
export type DeleteTransactionInput = z.infer<typeof deleteTransactionSchema>['params'];
export type AddPaymentInput = {
    params: z.infer<typeof addPaymentSchema>['params'];
    body: z.infer<typeof addPaymentSchema>['body'];
};
export type TransactionDetailInput = z.infer<typeof transactionDetailSchema>;

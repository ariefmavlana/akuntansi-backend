import { z } from 'zod';

// Payment types enum
const paymentTypeEnum = z.enum([
    'TUNAI',
    'TRANSFER_BANK',
    'CEK',
    'GIRO',
    'KARTU_KREDIT',
    'KARTU_DEBIT',
    'E_WALLET',
    'LAINNYA',
]);

// Create payment schema
export const createPaymentSchema = z.object({
    body: z.object({
        transaksiId: z.string().cuid('Transaksi ID tidak valid'),
        nomorPembayaran: z.string().min(1, 'Nomor pembayaran wajib diisi').optional(), // Auto-generated if not provided
        tanggal: z.string().datetime('Format tanggal tidak valid').or(z.date()),
        tipePembayaran: paymentTypeEnum,
        jumlah: z.number().min(0.01, 'Jumlah pembayaran harus lebih dari 0'),
        bankRekeningId: z.string().cuid().optional(),
        nomorReferensi: z.string().optional(),
        kurs: z.number().min(0).optional(),
        jumlahAsli: z.number().min(0).optional(),
        biayaAdmin: z.number().min(0).default(0),
        keterangan: z.string().optional(),
    }),
});

// Update payment schema
export const updatePaymentSchema = z.object({
    params: z.object({
        id: z.string().cuid('Payment ID tidak valid'),
    }),
    body: z.object({
        tanggal: z.string().datetime().or(z.date()).optional(),
        tipePembayaran: paymentTypeEnum.optional(),
        jumlah: z.number().min(0.01).optional(),
        bankRekeningId: z.string().cuid().optional(),
        nomorReferensi: z.string().optional(),
        kurs: z.number().min(0).optional(),
        jumlahAsli: z.number().min(0).optional(),
        biayaAdmin: z.number().min(0).optional(),
        keterangan: z.string().optional(),
    }),
});

// Get payment by ID schema
export const getPaymentByIdSchema = z.object({
    params: z.object({
        id: z.string().cuid('Payment ID tidak valid'),
    }),
});

// List payments schema
export const listPaymentsSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        transaksiId: z.string().cuid().optional(),
        perusahaanId: z.string().cuid().optional(),
        tipePembayaran: paymentTypeEnum.optional(),
        tanggalMulai: z.string().datetime().or(z.date()).optional(),
        tanggalAkhir: z.string().datetime().or(z.date()).optional(),
        isPosted: z
            .string()
            .transform((val) => val === 'true')
            .optional(),
    }),
});

// Post payment schema
export const postPaymentSchema = z.object({
    params: z.object({
        id: z.string().cuid('Payment ID tidak valid'),
    }),
    body: z.object({
        tanggalPosting: z.string().datetime().or(z.date()).optional(),
    }),
});

// Delete payment schema
export const deletePaymentSchema = z.object({
    params: z.object({
        id: z.string().cuid('Payment ID tidak valid'),
    }),
});

// Get payment summary schema
export const getPaymentSummarySchema = z.object({
    query: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        tanggalMulai: z.string().datetime().or(z.date()).optional(),
        tanggalAkhir: z.string().datetime().or(z.date()).optional(),
    }),
});

// TypeScript types
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>['body'];
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type GetPaymentByIdInput = z.infer<typeof getPaymentByIdSchema>['params'];
export type ListPaymentsInput = z.infer<typeof listPaymentsSchema>['query'];
export type PostPaymentInput = z.infer<typeof postPaymentSchema>;
export type DeletePaymentInput = z.infer<typeof deletePaymentSchema>['params'];
export type GetPaymentSummaryInput = z.infer<typeof getPaymentSummarySchema>['query'];

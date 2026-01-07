"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentSummarySchema = exports.deletePaymentSchema = exports.postPaymentSchema = exports.listPaymentsSchema = exports.getPaymentByIdSchema = exports.updatePaymentSchema = exports.createPaymentSchema = void 0;
const zod_1 = require("zod");
// Payment types enum
const paymentTypeEnum = zod_1.z.enum([
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
exports.createPaymentSchema = zod_1.z.object({
    body: zod_1.z.object({
        transaksiId: zod_1.z.string().cuid('Transaksi ID tidak valid'),
        nomorPembayaran: zod_1.z.string().min(1, 'Nomor pembayaran wajib diisi').optional(), // Auto-generated if not provided
        tanggal: zod_1.z.string().datetime('Format tanggal tidak valid').or(zod_1.z.date()),
        tipePembayaran: paymentTypeEnum,
        jumlah: zod_1.z.number().min(0.01, 'Jumlah pembayaran harus lebih dari 0'),
        bankRekeningId: zod_1.z.string().cuid().optional(),
        nomorReferensi: zod_1.z.string().optional(),
        kurs: zod_1.z.number().min(0).optional(),
        jumlahAsli: zod_1.z.number().min(0).optional(),
        biayaAdmin: zod_1.z.number().min(0).default(0),
        keterangan: zod_1.z.string().optional(),
    }),
});
// Update payment schema
exports.updatePaymentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Payment ID tidak valid'),
    }),
    body: zod_1.z.object({
        tanggal: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        tipePembayaran: paymentTypeEnum.optional(),
        jumlah: zod_1.z.number().min(0.01).optional(),
        bankRekeningId: zod_1.z.string().cuid().optional(),
        nomorReferensi: zod_1.z.string().optional(),
        kurs: zod_1.z.number().min(0).optional(),
        jumlahAsli: zod_1.z.number().min(0).optional(),
        biayaAdmin: zod_1.z.number().min(0).optional(),
        keterangan: zod_1.z.string().optional(),
    }),
});
// Get payment by ID schema
exports.getPaymentByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Payment ID tidak valid'),
    }),
});
// List payments schema
exports.listPaymentsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        transaksiId: zod_1.z.string().cuid().optional(),
        perusahaanId: zod_1.z.string().cuid().optional(),
        tipePembayaran: paymentTypeEnum.optional(),
        tanggalMulai: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        tanggalAkhir: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        isPosted: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional(),
    }),
});
// Post payment schema
exports.postPaymentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Payment ID tidak valid'),
    }),
    body: zod_1.z.object({
        tanggalPosting: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    }),
});
// Delete payment schema
exports.deletePaymentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Payment ID tidak valid'),
    }),
});
// Get payment summary schema
exports.getPaymentSummarySchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        tanggalMulai: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        tanggalAkhir: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    }),
});

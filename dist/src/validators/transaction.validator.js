"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPaymentSchema = exports.deleteTransactionSchema = exports.voidTransactionSchema = exports.postTransactionSchema = exports.listTransactionsSchema = exports.getTransactionByIdSchema = exports.updateTransactionSchema = exports.createTransactionSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// Transaction detail schema (for nested creation)
const transactionDetailSchema = zod_1.z.object({
    urutan: zod_1.z.number().int().min(1),
    akunId: zod_1.z.string().cuid('Akun ID tidak valid'),
    deskripsi: zod_1.z.string().optional(),
    kuantitas: zod_1.z.number().min(0).default(1),
    hargaSatuan: zod_1.z.number().min(0).default(0),
    diskon: zod_1.z.number().min(0).max(100).default(0),
    subtotal: zod_1.z.number().min(0),
    persediaanId: zod_1.z.string().cuid().optional(),
    asetTetapId: zod_1.z.string().cuid().optional(),
    catatan: zod_1.z.string().optional(),
});
// Create transaction schema
exports.createTransactionSchema = zod_1.z.object({
    body: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        cabangId: zod_1.z.string().cuid('Cabang ID tidak valid').optional(),
        periodeId: zod_1.z.string().cuid('Periode ID tidak valid'),
        tipe: zod_1.z.nativeEnum(client_1.TipeTransaksi, { errorMap: () => ({ message: 'Tipe transaksi tidak valid' }) }),
        nomorTransaksi: zod_1.z.string().min(1, 'Nomor transaksi wajib diisi').optional(), // Auto-generated if not provided
        tanggal: zod_1.z.string().datetime('Format tanggal tidak valid').or(zod_1.z.date()),
        tanggalJatuhTempo: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        // Related entities
        pelangganId: zod_1.z.string().cuid().optional(),
        supplierId: zod_1.z.string().cuid().optional(),
        proyekId: zod_1.z.string().cuid().optional(),
        departemenId: zod_1.z.string().cuid().optional(),
        // Amounts
        subtotal: zod_1.z.number().min(0),
        diskon: zod_1.z.number().min(0).default(0),
        pajakId: zod_1.z.string().cuid().optional(),
        jumlahPajak: zod_1.z.number().min(0).default(0),
        biayaLain: zod_1.z.number().min(0).default(0),
        total: zod_1.z.number().min(0),
        // Multi-currency
        mataUang: zod_1.z.string().default('IDR'),
        kurs: zod_1.z.number().min(0).default(1),
        totalAsli: zod_1.z.number().min(0).optional(),
        // Description and notes
        deskripsi: zod_1.z.string().min(1, 'Deskripsi wajib diisi'),
        catatan: zod_1.z.string().optional(),
        referensi: zod_1.z.string().optional(),
        // Transaction details (line items)
        detail: zod_1.z.array(transactionDetailSchema).min(1, 'Minimal 1 detail transaksi diperlukan'),
    }),
});
// Update transaction schema (only for DRAFT status)
exports.updateTransactionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Transaction ID tidak valid'),
    }),
    body: zod_1.z.object({
        tanggal: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        tanggalJatuhTempo: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        pelangganId: zod_1.z.string().cuid().optional().nullable(),
        supplierId: zod_1.z.string().cuid().optional().nullable(),
        proyekId: zod_1.z.string().cuid().optional().nullable(),
        departemenId: zod_1.z.string().cuid().optional().nullable(),
        subtotal: zod_1.z.number().min(0).optional(),
        diskon: zod_1.z.number().min(0).optional(),
        pajakId: zod_1.z.string().cuid().optional().nullable(),
        jumlahPajak: zod_1.z.number().min(0).optional(),
        biayaLain: zod_1.z.number().min(0).optional(),
        total: zod_1.z.number().min(0).optional(),
        deskripsi: zod_1.z.string().min(1).optional(),
        catatan: zod_1.z.string().optional(),
        referensi: zod_1.z.string().optional(),
        detail: zod_1.z.array(transactionDetailSchema).min(1).optional(),
    }),
});
// Get transaction by ID schema
exports.getTransactionByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Transaction ID tidak valid'),
    }),
});
// List transactions schema
exports.listTransactionsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: zod_1.z.string().cuid().optional(),
        cabangId: zod_1.z.string().cuid().optional(),
        periodeId: zod_1.z.string().cuid().optional(),
        tipe: zod_1.z.nativeEnum(client_1.TipeTransaksi).optional(),
        statusPembayaran: zod_1.z.nativeEnum(client_1.StatusPembayaran).optional(),
        pelangganId: zod_1.z.string().cuid().optional(),
        supplierId: zod_1.z.string().cuid().optional(),
        search: zod_1.z.string().optional(),
        tanggalMulai: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        tanggalAkhir: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        isPosted: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional(),
    }),
});
// Post transaction schema
exports.postTransactionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Transaction ID tidak valid'),
    }),
    body: zod_1.z.object({
        tanggalPosting: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    }),
});
// Void transaction schema
exports.voidTransactionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Transaction ID tidak valid'),
    }),
    body: zod_1.z.object({
        alasan: zod_1.z.string().min(1, 'Alasan void wajib diisi'),
    }),
});
// Delete transaction schema
exports.deleteTransactionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Transaction ID tidak valid'),
    }),
});
// Payment schema
const paymentSchema = zod_1.z.object({
    nomorPembayaran: zod_1.z.string().optional(), // Auto-generated if not provided
    tanggal: zod_1.z.string().datetime().or(zod_1.z.date()),
    tipePembayaran: zod_1.z.nativeEnum(client_1.TipePembayaran),
    jumlah: zod_1.z.number().min(0),
    bankRekeningId: zod_1.z.string().cuid().optional(),
    nomorReferensi: zod_1.z.string().optional(),
    kurs: zod_1.z.number().min(0).optional(),
    jumlahAsli: zod_1.z.number().min(0).optional(),
    biayaAdmin: zod_1.z.number().min(0).default(0),
    keterangan: zod_1.z.string().optional(),
});
// Add payment to transaction
exports.addPaymentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Transaction ID tidak valid'),
    }),
    body: paymentSchema,
});

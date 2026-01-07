"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTaxTransactionsSchema = exports.getTaxReportSchema = exports.createTaxTransactionSchema = exports.calculatePPNSchema = exports.calculatePPh21Schema = void 0;
const zod_1 = require("zod");
// Tax types for Indonesia
const taxTypeEnum = zod_1.z.enum([
    'PPH_21', // Income tax for employees
    'PPH_22', // Import/export tax
    'PPH_23', // Service tax
    'PPH_25', // Monthly installment
    'PPH_26', // Foreign tax
    'PPH_29', // Annual tax
    'PPH_4_2', // Final tax
    'PPN', // VAT
    'PPnBM', // Luxury tax
]);
// Calculate PPh 21 schema
exports.calculatePPh21Schema = zod_1.z.object({
    body: zod_1.z.object({
        penghasilanBruto: zod_1.z.number().min(0, 'Penghasilan bruto harus positif'),
        statusPerkawinan: zod_1.z.enum(['TK', 'K']), // TK = Tidak Kawin, K = Kawin
        jumlahTanggungan: zod_1.z.number().int().min(0).max(3).default(0),
        iuranPensiun: zod_1.z.number().min(0).default(0),
        iuranJHT: zod_1.z.number().min(0).default(0),
    }),
});
// Calculate PPN schema
exports.calculatePPNSchema = zod_1.z.object({
    body: zod_1.z.object({
        dpp: zod_1.z.number().min(0, 'DPP harus positif'), // Dasar Pengenaan Pajak
        tarifPPN: zod_1.z.number().min(0).max(100).default(11), // Default 11% (2022+)
        isPKP: zod_1.z.boolean().default(true), // Pengusaha Kena Pajak
    }),
});
// Create tax transaction schema
exports.createTaxTransactionSchema = zod_1.z.object({
    body: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        transaksiId: zod_1.z.string().cuid('Transaksi ID tidak valid').optional(),
        tipePajak: taxTypeEnum,
        nomorBuktiPotong: zod_1.z.string().optional(),
        tanggal: zod_1.z.string().datetime('Format tanggal tidak valid').or(zod_1.z.date()),
        dpp: zod_1.z.number().min(0, 'DPP harus positif'),
        tarif: zod_1.z.number().min(0).max(100),
        jumlahPajak: zod_1.z.number().min(0),
        npwpPemotong: zod_1.z.string().optional(),
        namaPemotong: zod_1.z.string().optional(),
        keterangan: zod_1.z.string().optional(),
    }),
});
// Get tax report schema
exports.getTaxReportSchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        tipePajak: taxTypeEnum.optional(),
        tahun: zod_1.z.string().regex(/^\d{4}$/).transform(Number),
        bulan: zod_1.z.string().regex(/^(0?[1-9]|1[0-2])$/).transform(Number).optional(),
    }),
});
// List tax transactions schema
exports.listTaxTransactionsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: zod_1.z.string().cuid().optional(),
        tipePajak: taxTypeEnum.optional(),
        tanggalMulai: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        tanggalAkhir: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    }),
});

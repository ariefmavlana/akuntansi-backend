import { z } from 'zod';

// Tax types for Indonesia
const taxTypeEnum = z.enum([
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
export const calculatePPh21Schema = z.object({
    body: z.object({
        penghasilanBruto: z.number().min(0, 'Penghasilan bruto harus positif'),
        statusPerkawinan: z.enum(['TK', 'K']), // TK = Tidak Kawin, K = Kawin
        jumlahTanggungan: z.number().int().min(0).max(3).default(0),
        iuranPensiun: z.number().min(0).default(0),
        iuranJHT: z.number().min(0).default(0),
    }),
});

// Calculate PPN schema
export const calculatePPNSchema = z.object({
    body: z.object({
        dpp: z.number().min(0, 'DPP harus positif'), // Dasar Pengenaan Pajak
        tarifPPN: z.number().min(0).max(100).default(11), // Default 11% (2022+)
        isPKP: z.boolean().default(true), // Pengusaha Kena Pajak
    }),
});

// Create tax transaction schema
export const createTaxTransactionSchema = z.object({
    body: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        transaksiId: z.string().cuid('Transaksi ID tidak valid').optional(),
        tipePajak: taxTypeEnum,
        nomorBuktiPotong: z.string().optional(),
        tanggal: z.string().datetime('Format tanggal tidak valid').or(z.date()),
        dpp: z.number().min(0, 'DPP harus positif'),
        tarif: z.number().min(0).max(100),
        jumlahPajak: z.number().min(0),
        npwpPemotong: z.string().optional(),
        namaPemotong: z.string().optional(),
        keterangan: z.string().optional(),
    }),
});

// Get tax report schema
export const getTaxReportSchema = z.object({
    query: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        tipePajak: taxTypeEnum.optional(),
        tahun: z.string().regex(/^\d{4}$/).transform(Number),
        bulan: z.string().regex(/^(0?[1-9]|1[0-2])$/).transform(Number).optional(),
    }),
});

// List tax transactions schema
export const listTaxTransactionsSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: z.string().cuid().optional(),
        tipePajak: taxTypeEnum.optional(),
        tanggalMulai: z.string().datetime().or(z.date()).optional(),
        tanggalAkhir: z.string().datetime().or(z.date()).optional(),
    }),
});

// TypeScript types
export type CalculatePPh21Input = z.infer<typeof calculatePPh21Schema>['body'];
export type CalculatePPNInput = z.infer<typeof calculatePPNSchema>['body'];
export type CreateTaxTransactionInput = z.infer<typeof createTaxTransactionSchema>['body'];
export type GetTaxReportInput = z.infer<typeof getTaxReportSchema>['query'];
export type ListTaxTransactionsInput = z.infer<typeof listTaxTransactionsSchema>['query'];

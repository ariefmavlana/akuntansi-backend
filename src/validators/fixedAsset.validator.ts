import { z } from 'zod';

// Fixed asset validators
export const createFixedAssetSchema = z.object({
    body: z.object({
        perusahaanId: z.string().cuid(),
        kodeAset: z.string().min(1).optional(),
        namaAset: z.string().min(1, 'Nama aset wajib diisi'),
        kategori: z.enum(['TANAH', 'BANGUNAN', 'KENDARAAN', 'MESIN', 'PERALATAN', 'FURNITURE', 'LAINNYA']),
        tanggalPerolehan: z.string().datetime().or(z.date()),
        nilaiPerolehan: z.number().min(0, 'Nilai perolehan harus positif'),
        nilaiResidu: z.number().min(0).default(0),
        masaManfaat: z.number().int().min(1, 'Masa manfaat minimal 1 tahun'),
        metodePenyusutan: z.enum(['GARIS_LURUS', 'SALDO_MENURUN', 'UNIT_PRODUKSI']).default('GARIS_LURUS'),
        lokasiId: z.string().optional(),
        pemasokId: z.string().cuid().optional(),
        keterangan: z.string().optional(),
    }),
});

export const calculateDepreciationSchema = z.object({
    params: z.object({
        id: z.string().cuid(),
    }),
    body: z.object({
        tanggalHitung: z.string().datetime().or(z.date()).optional(),
    }),
});

export const disposeAssetSchema = z.object({
    params: z.object({
        id: z.string().cuid(),
    }),
    body: z.object({
        tanggalPelepasan: z.string().datetime().or(z.date()),
        nilaiPelepasan: z.number().min(0),
        alasan: z.string().min(1, 'Alasan pelepasan wajib diisi'),
    }),
});

export const listFixedAssetsSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: z.string().cuid().optional(),
        kategori: z.enum(['TANAH', 'BANGUNAN', 'KENDARAAN', 'MESIN', 'PERALATAN', 'FURNITURE', 'LAINNYA']).optional(),
        status: z.enum(['AKTIF', 'DILEPAS']).optional(),
    }),
});

export type CreateFixedAssetInput = z.infer<typeof createFixedAssetSchema>['body'];
export type CalculateDepreciationInput = z.infer<typeof calculateDepreciationSchema>;
export type DisposeAssetInput = z.infer<typeof disposeAssetSchema>;
export type ListFixedAssetsInput = z.infer<typeof listFixedAssetsSchema>['query'];

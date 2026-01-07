"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFixedAssetsSchema = exports.disposeAssetSchema = exports.calculateDepreciationSchema = exports.createFixedAssetSchema = void 0;
const zod_1 = require("zod");
// Fixed asset validators
exports.createFixedAssetSchema = zod_1.z.object({
    body: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid(),
        kodeAset: zod_1.z.string().min(1).optional(),
        namaAset: zod_1.z.string().min(1, 'Nama aset wajib diisi'),
        kategori: zod_1.z.enum(['TANAH', 'BANGUNAN', 'KENDARAAN', 'MESIN', 'PERALATAN', 'FURNITURE', 'LAINNYA']),
        tanggalPerolehan: zod_1.z.string().datetime().or(zod_1.z.date()),
        nilaiPerolehan: zod_1.z.number().min(0, 'Nilai perolehan harus positif'),
        nilaiResidu: zod_1.z.number().min(0).default(0),
        masaManfaat: zod_1.z.number().int().min(1, 'Masa manfaat minimal 1 tahun'),
        metodePenyusutan: zod_1.z.enum(['GARIS_LURUS', 'SALDO_MENURUN', 'UNIT_PRODUKSI']).default('GARIS_LURUS'),
        lokasiId: zod_1.z.string().optional(),
        pemasokId: zod_1.z.string().cuid().optional(),
        keterangan: zod_1.z.string().optional(),
    }),
});
exports.calculateDepreciationSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid(),
    }),
    body: zod_1.z.object({
        tanggalHitung: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    }),
});
exports.disposeAssetSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid(),
    }),
    body: zod_1.z.object({
        tanggalPelepasan: zod_1.z.string().datetime().or(zod_1.z.date()),
        nilaiPelepasan: zod_1.z.number().min(0),
        alasan: zod_1.z.string().min(1, 'Alasan pelepasan wajib diisi'),
    }),
});
exports.listFixedAssetsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: zod_1.z.string().cuid().optional(),
        kategori: zod_1.z.enum(['TANAH', 'BANGUNAN', 'KENDARAAN', 'MESIN', 'PERALATAN', 'FURNITURE', 'LAINNYA']).optional(),
        status: zod_1.z.enum(['AKTIF', 'DILEPAS']).optional(),
    }),
});

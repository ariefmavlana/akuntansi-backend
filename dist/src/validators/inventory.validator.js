"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listInventorySchema = exports.stockMovementSchema = exports.updateInventorySchema = exports.createInventorySchema = void 0;
const zod_1 = require("zod");
// Inventory validators - streamlined for essential features
exports.createInventorySchema = zod_1.z.object({
    body: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid(),
        kodeBarang: zod_1.z.string().min(1).optional(),
        namaBarang: zod_1.z.string().min(1, 'Nama barang wajib diisi'),
        kategori: zod_1.z.string().optional(),
        satuan: zod_1.z.string().default('PCS'),
        hargaBeli: zod_1.z.number().min(0).default(0),
        hargaJual: zod_1.z.number().min(0).default(0),
        stokMinimal: zod_1.z.number().min(0).default(0),
        stokAwal: zod_1.z.number().min(0).default(0),
        gudangId: zod_1.z.string().cuid().optional(),
        pemasokId: zod_1.z.string().cuid().optional(),
        keterangan: zod_1.z.string().optional(),
    }),
});
exports.updateInventorySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid(),
    }),
    body: zod_1.z.object({
        namaBarang: zod_1.z.string().min(1).optional(),
        kategori: zod_1.z.string().optional(),
        satuan: zod_1.z.string().optional(),
        hargaBeli: zod_1.z.number().min(0).optional(),
        hargaJual: zod_1.z.number().min(0).optional(),
        stokMinimal: zod_1.z.number().min(0).optional(),
        keterangan: zod_1.z.string().optional(),
    }),
});
exports.stockMovementSchema = zod_1.z.object({
    body: zod_1.z.object({
        inventoryId: zod_1.z.string().cuid(),
        tipe: zod_1.z.enum(['MASUK', 'KELUAR', 'PENYESUAIAN']),
        jumlah: zod_1.z.number().min(0.01),
        harga: zod_1.z.number().min(0).optional(),
        gudangId: zod_1.z.string().cuid().optional(),
        referensi: zod_1.z.string().optional(),
        keterangan: zod_1.z.string().optional(),
    }),
});
exports.listInventorySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: zod_1.z.string().cuid().optional(),
        kategori: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
    }),
});

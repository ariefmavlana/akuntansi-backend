import { z } from 'zod';

// Inventory validators - streamlined for essential features
export const createInventorySchema = z.object({
    body: z.object({
        perusahaanId: z.string().cuid(),
        kodeBarang: z.string().min(1).optional(),
        namaBarang: z.string().min(1, 'Nama barang wajib diisi'),
        kategori: z.string().optional(),
        satuan: z.string().default('PCS'),
        hargaBeli: z.number().min(0).default(0),
        hargaJual: z.number().min(0).default(0),
        stokMinimal: z.number().min(0).default(0),
        stokAwal: z.number().min(0).default(0),
        gudangId: z.string().cuid().optional(),
        pemasokId: z.string().cuid().optional(),
        keterangan: z.string().optional(),
    }),
});

export const updateInventorySchema = z.object({
    params: z.object({
        id: z.string().cuid(),
    }),
    body: z.object({
        namaBarang: z.string().min(1).optional(),
        kategori: z.string().optional(),
        satuan: z.string().optional(),
        hargaBeli: z.number().min(0).optional(),
        hargaJual: z.number().min(0).optional(),
        stokMinimal: z.number().min(0).optional(),
        keterangan: z.string().optional(),
    }),
});

export const stockMovementSchema = z.object({
    body: z.object({
        inventoryId: z.string().cuid(),
        tipe: z.enum(['MASUK', 'KELUAR', 'PENYESUAIAN']),
        jumlah: z.number().min(0.01),
        harga: z.number().min(0).optional(),
        gudangId: z.string().cuid().optional(),
        referensi: z.string().optional(),
        keterangan: z.string().optional(),
    }),
});

export const listInventorySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: z.string().cuid().optional(),
        kategori: z.string().optional(),
        search: z.string().optional(),
    }),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>['body'];
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>['body'];
export type ListInventoryInput = z.infer<typeof listInventorySchema>['query'];

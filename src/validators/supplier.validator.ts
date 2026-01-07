import { z } from 'zod';

// Create supplier schema
export const createSupplierSchema = z.object({
    body: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        kodePemasok: z.string().min(1, 'Kode pemasok wajib diisi').optional(), // Auto-generated if not provided
        nama: z.string().min(1, 'Nama pemasok wajib diisi'),
        namaPerusahaan: z.string().optional(),
        alamat: z.string().optional(),
        kota: z.string().optional(),
        provinsi: z.string().optional(),
        kodePos: z.string().optional(),
        telepon: z.string().optional(),
        email: z.string().email('Format email tidak valid').optional(),
        website: z.string().url('Format website tidak valid').optional().or(z.literal('')),
        npwp: z.string().optional(),
        kontakPerson: z.string().optional(),
        teleponKontak: z.string().optional(),
        batasKredit: z.number().min(0).default(0),
        termPembayaran: z.number().int().min(0).default(30),
        kategori: z.string().optional(),
        nomorRekening: z.string().optional(),
        namaBank: z.string().optional(),
        atasNama: z.string().optional(),
        catatan: z.string().optional(),
    }),
});

// Update supplier schema
export const updateSupplierSchema = z.object({
    params: z.object({
        id: z.string().cuid('Supplier ID tidak valid'),
    }),
    body: z.object({
        nama: z.string().min(1).optional(),
        namaPerusahaan: z.string().optional(),
        alamat: z.string().optional(),
        kota: z.string().optional(),
        provinsi: z.string().optional(),
        kodePos: z.string().optional(),
        telepon: z.string().optional(),
        email: z.string().email().optional(),
        website: z.string().url().optional().or(z.literal('')),
        npwp: z.string().optional(),
        kontakPerson: z.string().optional(),
        teleponKontak: z.string().optional(),
        batasKredit: z.number().min(0).optional(),
        termPembayaran: z.number().int().min(0).optional(),
        kategori: z.string().optional(),
        nomorRekening: z.string().optional(),
        namaBank: z.string().optional(),
        atasNama: z.string().optional(),
        catatan: z.string().optional(),
    }),
});

// Get supplier by ID schema
export const getSupplierByIdSchema = z.object({
    params: z.object({
        id: z.string().cuid('Supplier ID tidak valid'),
    }),
});

// List suppliers schema
export const listSuppliersSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: z.string().cuid().optional(),
        search: z.string().optional(),
        kategori: z.string().optional(),
        isAktif: z
            .string()
            .transform((val) => val === 'true')
            .optional(),
    }),
});

// Get supplier aging schema
export const getSupplierAgingSchema = z.object({
    query: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        supplierId: z.string().cuid().optional(),
        tanggal: z.string().datetime().or(z.date()).optional(),
    }),
});

// Delete supplier schema
export const deleteSupplierSchema = z.object({
    params: z.object({
        id: z.string().cuid('Supplier ID tidak valid'),
    }),
});

// Activate/Deactivate supplier schema
export const toggleSupplierStatusSchema = z.object({
    params: z.object({
        id: z.string().cuid('Supplier ID tidak valid'),
    }),
});

// TypeScript types
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>['body'];
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type GetSupplierByIdInput = z.infer<typeof getSupplierByIdSchema>['params'];
export type ListSuppliersInput = z.infer<typeof listSuppliersSchema>['query'];
export type GetSupplierAgingInput = z.infer<typeof getSupplierAgingSchema>['query'];
export type DeleteSupplierInput = z.infer<typeof deleteSupplierSchema>['params'];
export type ToggleSupplierStatusInput = z.infer<typeof toggleSupplierStatusSchema>['params'];

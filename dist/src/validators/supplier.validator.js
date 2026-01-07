"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleSupplierStatusSchema = exports.deleteSupplierSchema = exports.getSupplierAgingSchema = exports.listSuppliersSchema = exports.getSupplierByIdSchema = exports.updateSupplierSchema = exports.createSupplierSchema = void 0;
const zod_1 = require("zod");
// Create supplier schema
exports.createSupplierSchema = zod_1.z.object({
    body: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        kodePemasok: zod_1.z.string().min(1, 'Kode pemasok wajib diisi').optional(), // Auto-generated if not provided
        nama: zod_1.z.string().min(1, 'Nama pemasok wajib diisi'),
        namaPerusahaan: zod_1.z.string().optional(),
        alamat: zod_1.z.string().optional(),
        kota: zod_1.z.string().optional(),
        provinsi: zod_1.z.string().optional(),
        kodePos: zod_1.z.string().optional(),
        telepon: zod_1.z.string().optional(),
        email: zod_1.z.string().email('Format email tidak valid').optional(),
        website: zod_1.z.string().url('Format website tidak valid').optional().or(zod_1.z.literal('')),
        npwp: zod_1.z.string().optional(),
        kontakPerson: zod_1.z.string().optional(),
        teleponKontak: zod_1.z.string().optional(),
        batasKredit: zod_1.z.number().min(0).default(0),
        termPembayaran: zod_1.z.number().int().min(0).default(30),
        kategori: zod_1.z.string().optional(),
        nomorRekening: zod_1.z.string().optional(),
        namaBank: zod_1.z.string().optional(),
        atasNama: zod_1.z.string().optional(),
        catatan: zod_1.z.string().optional(),
    }),
});
// Update supplier schema
exports.updateSupplierSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Supplier ID tidak valid'),
    }),
    body: zod_1.z.object({
        nama: zod_1.z.string().min(1).optional(),
        namaPerusahaan: zod_1.z.string().optional(),
        alamat: zod_1.z.string().optional(),
        kota: zod_1.z.string().optional(),
        provinsi: zod_1.z.string().optional(),
        kodePos: zod_1.z.string().optional(),
        telepon: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        website: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
        npwp: zod_1.z.string().optional(),
        kontakPerson: zod_1.z.string().optional(),
        teleponKontak: zod_1.z.string().optional(),
        batasKredit: zod_1.z.number().min(0).optional(),
        termPembayaran: zod_1.z.number().int().min(0).optional(),
        kategori: zod_1.z.string().optional(),
        nomorRekening: zod_1.z.string().optional(),
        namaBank: zod_1.z.string().optional(),
        atasNama: zod_1.z.string().optional(),
        catatan: zod_1.z.string().optional(),
    }),
});
// Get supplier by ID schema
exports.getSupplierByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Supplier ID tidak valid'),
    }),
});
// List suppliers schema
exports.listSuppliersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: zod_1.z.string().cuid().optional(),
        search: zod_1.z.string().optional(),
        kategori: zod_1.z.string().optional(),
        isAktif: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional(),
    }),
});
// Get supplier aging schema
exports.getSupplierAgingSchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        supplierId: zod_1.z.string().cuid().optional(),
        tanggal: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    }),
});
// Delete supplier schema
exports.deleteSupplierSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Supplier ID tidak valid'),
    }),
});
// Activate/Deactivate supplier schema
exports.toggleSupplierStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Supplier ID tidak valid'),
    }),
});

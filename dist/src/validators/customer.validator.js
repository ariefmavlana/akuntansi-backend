"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleCustomerStatusSchema = exports.deleteCustomerSchema = exports.getCustomerAgingSchema = exports.listCustomersSchema = exports.getCustomerByIdSchema = exports.updateCustomerSchema = exports.createCustomerSchema = void 0;
const zod_1 = require("zod");
// Create customer schema
exports.createCustomerSchema = zod_1.z.object({
    body: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        kodePelanggan: zod_1.z.string().min(1, 'Kode pelanggan wajib diisi').optional(), // Auto-generated if not provided
        nama: zod_1.z.string().min(1, 'Nama pelanggan wajib diisi'),
        namaPerusahaan: zod_1.z.string().optional(),
        tipe: zod_1.z.enum(['INDIVIDUAL', 'PERUSAHAAN']).default('INDIVIDUAL'),
        alamat: zod_1.z.string().optional(),
        kota: zod_1.z.string().optional(),
        provinsi: zod_1.z.string().optional(),
        kodePos: zod_1.z.string().optional(),
        telepon: zod_1.z.string().optional(),
        email: zod_1.z.string().email('Format email tidak valid').optional(),
        website: zod_1.z.string().url('Format website tidak valid').optional().or(zod_1.z.literal('')),
        npwp: zod_1.z.string().optional(),
        nik: zod_1.z.string().optional(),
        kontakPerson: zod_1.z.string().optional(),
        teleponKontak: zod_1.z.string().optional(),
        batasKredit: zod_1.z.number().min(0).default(0),
        termPembayaran: zod_1.z.number().int().min(0).default(30),
        kategori: zod_1.z.string().optional(),
        grup: zod_1.z.string().optional(),
        salesPerson: zod_1.z.string().optional(),
        catatan: zod_1.z.string().optional(),
    }),
});
// Update customer schema
exports.updateCustomerSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Customer ID tidak valid'),
    }),
    body: zod_1.z.object({
        nama: zod_1.z.string().min(1).optional(),
        namaPerusahaan: zod_1.z.string().optional(),
        tipe: zod_1.z.enum(['INDIVIDUAL', 'PERUSAHAAN']).optional(),
        alamat: zod_1.z.string().optional(),
        kota: zod_1.z.string().optional(),
        provinsi: zod_1.z.string().optional(),
        kodePos: zod_1.z.string().optional(),
        telepon: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        website: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
        npwp: zod_1.z.string().optional(),
        nik: zod_1.z.string().optional(),
        kontakPerson: zod_1.z.string().optional(),
        teleponKontak: zod_1.z.string().optional(),
        batasKredit: zod_1.z.number().min(0).optional(),
        termPembayaran: zod_1.z.number().int().min(0).optional(),
        kategori: zod_1.z.string().optional(),
        grup: zod_1.z.string().optional(),
        salesPerson: zod_1.z.string().optional(),
        catatan: zod_1.z.string().optional(),
    }),
});
// Get customer by ID schema
exports.getCustomerByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Customer ID tidak valid'),
    }),
});
// List customers schema
exports.listCustomersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: zod_1.z.string().cuid().optional(),
        search: zod_1.z.string().optional(),
        tipe: zod_1.z.enum(['INDIVIDUAL', 'PERUSAHAAN']).optional(),
        kategori: zod_1.z.string().optional(),
        grup: zod_1.z.string().optional(),
        isAktif: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional(),
    }),
});
// Get customer aging schema
exports.getCustomerAgingSchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        customerId: zod_1.z.string().cuid().optional(),
        tanggal: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    }),
});
// Delete customer schema
exports.deleteCustomerSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Customer ID tidak valid'),
    }),
});
// Activate/Deactivate customer schema
exports.toggleCustomerStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Customer ID tidak valid'),
    }),
});

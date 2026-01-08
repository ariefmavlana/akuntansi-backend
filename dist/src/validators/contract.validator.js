"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteContractSchema = exports.listContractsSchema = exports.getContractByIdSchema = exports.updateContractSchema = exports.createContractSchema = void 0;
const zod_1 = require("zod");
// Create contract schema
exports.createContractSchema = zod_1.z.object({
    body: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        nomorKontrak: zod_1.z.string().min(1, 'Nomor kontrak wajib diisi'),
        namaKontrak: zod_1.z.string().min(1, 'Nama kontrak wajib diisi'),
        pihakKedua: zod_1.z.string().min(1, 'Pihak kedua wajib diisi'),
        tanggalMulai: zod_1.z.string().datetime().or(zod_1.z.date()),
        tanggalAkhir: zod_1.z.string().datetime().or(zod_1.z.date()),
        nilaiKontrak: zod_1.z.number().min(0, 'Nilai kontrak harus positif'),
        jenis: zod_1.z.string().min(1, 'Jenis kontrak wajib diisi'),
        status: zod_1.z.string().optional().default('AKTIF'),
        deskripsi: zod_1.z.string().optional(),
    }),
});
// Update contract schema
exports.updateContractSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Contract ID tidak valid'),
    }),
    body: zod_1.z.object({
        nomorKontrak: zod_1.z.string().min(1).optional(),
        namaKontrak: zod_1.z.string().min(1).optional(),
        pihakKedua: zod_1.z.string().min(1).optional(),
        tanggalMulai: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        tanggalAkhir: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        nilaiKontrak: zod_1.z.number().min(0).optional(),
        jenis: zod_1.z.string().min(1).optional(),
        status: zod_1.z.string().optional(),
        deskripsi: zod_1.z.string().optional(),
    }),
});
// Get contract by ID schema
exports.getContractByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Contract ID tidak valid'),
    }),
});
// List contracts schema
exports.listContractsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: zod_1.z.string().cuid().optional(),
        status: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        jenis: zod_1.z.string().optional(),
        tanggalMulai: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        tanggalAkhir: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    }),
});
// Delete contract schema
exports.deleteContractSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Contract ID tidak valid'),
    }),
});

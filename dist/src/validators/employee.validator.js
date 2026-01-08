"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmployeeSchema = exports.listEmployeesSchema = exports.getEmployeeByIdSchema = exports.updateEmployeeSchema = exports.createEmployeeSchema = void 0;
const zod_1 = require("zod");
// Create employee schema
exports.createEmployeeSchema = zod_1.z.object({
    body: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        nik: zod_1.z.string().min(1, 'NIK wajib diisi'),
        nama: zod_1.z.string().min(1, 'Nama wajib diisi'),
        tempatLahir: zod_1.z.string().optional(),
        tanggalLahir: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        jenisKelamin: zod_1.z.string().optional(),
        alamat: zod_1.z.string().optional(),
        kota: zod_1.z.string().optional(),
        telepon: zod_1.z.string().optional(),
        email: zod_1.z.string().email('Email tidak valid').optional().or(zod_1.z.literal('')),
        ktp: zod_1.z.string().optional(),
        npwp: zod_1.z.string().optional(),
        bpjsKesehatan: zod_1.z.string().optional(),
        bpjsKetenagakerjaan: zod_1.z.string().optional(),
        tanggalMasuk: zod_1.z.string().datetime().or(zod_1.z.date()),
        status: zod_1.z.string().optional().default('AKTIF'),
        statusPtkp: zod_1.z.string().regex(/^(TK|K|K\/I)\/[0-3]$/, 'Format PTKP tidak valid (contoh: TK/0, K/1)').optional().default('TK/0'),
        departemen: zod_1.z.string().optional(),
        jabatan: zod_1.z.string().optional(),
        level: zod_1.z.string().optional(),
        gajiPokok: zod_1.z.number().min(0),
        bankNama: zod_1.z.string().optional(),
        bankRekening: zod_1.z.string().optional(),
        catatan: zod_1.z.string().optional(),
    }),
});
// Update employee schema
exports.updateEmployeeSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Employee ID tidak valid'),
    }),
    body: zod_1.z.object({
        nik: zod_1.z.string().min(1).optional(),
        nama: zod_1.z.string().min(1).optional(),
        tempatLahir: zod_1.z.string().optional(),
        tanggalLahir: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        jenisKelamin: zod_1.z.string().optional(),
        alamat: zod_1.z.string().optional(),
        kota: zod_1.z.string().optional(),
        telepon: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
        ktp: zod_1.z.string().optional(),
        npwp: zod_1.z.string().optional(),
        bpjsKesehatan: zod_1.z.string().optional(),
        bpjsKetenagakerjaan: zod_1.z.string().optional(),
        tanggalMasuk: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        tanggalKeluar: zod_1.z.string().datetime().or(zod_1.z.date()).optional().nullable(),
        status: zod_1.z.string().optional(),
        departemen: zod_1.z.string().optional(),
        jabatan: zod_1.z.string().optional(),
        level: zod_1.z.string().optional(),
        gajiPokok: zod_1.z.number().min(0).optional(),
        bankNama: zod_1.z.string().optional(),
        bankRekening: zod_1.z.string().optional(),
        catatan: zod_1.z.string().optional(),
    }),
});
// Get employee by ID schema
exports.getEmployeeByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Employee ID tidak valid'),
    }),
});
// List employees schema
exports.listEmployeesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: zod_1.z.string().cuid().optional(),
        status: zod_1.z.string().optional(),
        departemen: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
    }),
});
// Delete employee schema
exports.deleteEmployeeSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Employee ID tidak valid'),
    }),
});

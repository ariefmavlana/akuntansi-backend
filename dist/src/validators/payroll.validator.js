"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePayrollSchema = exports.payPayrollSchema = exports.listPayrollsSchema = exports.getPayrollByIdSchema = exports.updatePayrollSchema = exports.generatePayrollSchema = exports.createPayrollSchema = void 0;
const zod_1 = require("zod");
// Create payroll schema (Manual Single Entry)
exports.createPayrollSchema = zod_1.z.object({
    body: zod_1.z.object({
        karyawanId: zod_1.z.string().cuid('Karyawan ID tidak valid'),
        periode: zod_1.z.string().regex(/^\d{4}-\d{2}$/, 'Format periode harus YYYY-MM'),
        tanggalBayar: zod_1.z.string().datetime().or(zod_1.z.date()),
        gajiPokok: zod_1.z.number().min(0, 'Gaji pokok harus positif'),
        tunjangan: zod_1.z.number().min(0).default(0),
        lembur: zod_1.z.number().min(0).default(0),
        bonus: zod_1.z.number().min(0).default(0),
        potonganBpjs: zod_1.z.number().min(0).default(0),
        potonganPph21: zod_1.z.number().min(0).default(0),
        potonganLainnya: zod_1.z.number().min(0).default(0),
        keterangan: zod_1.z.string().optional(),
    }),
});
// Generate payroll schema (Batch)
exports.generatePayrollSchema = zod_1.z.object({
    body: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        periode: zod_1.z.string().regex(/^\d{4}-\d{2}$/, 'Format periode harus YYYY-MM'),
        tanggalBayar: zod_1.z.string().datetime().or(zod_1.z.date()),
    }),
});
// Update payroll schema
exports.updatePayrollSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Payroll ID tidak valid'),
    }),
    body: zod_1.z.object({
        tanggalBayar: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
        gajiPokok: zod_1.z.number().min(0).optional(),
        tunjangan: zod_1.z.number().min(0).optional(),
        lembur: zod_1.z.number().min(0).optional(),
        bonus: zod_1.z.number().min(0).optional(),
        potonganBpjs: zod_1.z.number().min(0).optional(),
        potonganPph21: zod_1.z.number().min(0).optional(),
        potonganLainnya: zod_1.z.number().min(0).optional(),
        keterangan: zod_1.z.string().optional(),
    }),
});
// Get payroll by ID schema
exports.getPayrollByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Payroll ID tidak valid'),
    }),
});
// List payrolls schema
exports.listPayrollsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        karyawanId: zod_1.z.string().cuid().optional(),
        perusahaanId: zod_1.z.string().cuid().optional(), // Linked via Karyawan -> Perusahaan? No direct link in Penggajian schema, but via Karyawan.
        periode: zod_1.z.string().regex(/^\d{4}-\d{2}$/).optional(),
        status: zod_1.z.enum(['PAID', 'UNPAID']).optional(), // Mapped to sudoDibayar
    }),
});
// Pay payroll schema
exports.payPayrollSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Payroll ID tidak valid'),
    }),
    body: zod_1.z.object({
        akunKasId: zod_1.z.string().cuid('Akun Kas ID tidak valid'), // Account to credit (Bank/Cash)
        akunBebanId: zod_1.z.string().cuid('Akun Beban ID tidak valid').optional(), // Optional override
    }),
});
// Delete payroll schema
exports.deletePayrollSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Payroll ID tidak valid'),
    }),
});

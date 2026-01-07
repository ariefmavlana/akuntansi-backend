"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCoaBalanceSchema = exports.getCoaHierarchySchema = exports.deleteCoaSchema = exports.listCoaSchema = exports.getCoaByIdSchema = exports.updateCoaSchema = exports.createCoaSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// Create COA schema
exports.createCoaSchema = zod_1.z.object({
    body: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        kodeAkun: zod_1.z
            .string()
            .min(1, 'Kode akun wajib diisi')
            .max(20, 'Kode akun maksimal 20 karakter')
            .regex(/^[0-9.-]+$/, 'Kode akun hanya boleh angka, titik, dan strip'),
        namaAkun: zod_1.z.string().min(1, 'Nama akun wajib diisi').max(200, 'Nama akun maksimal 200 karakter'),
        tipe: zod_1.z.nativeEnum(client_1.TipeAkun, { errorMap: () => ({ message: 'Tipe akun tidak valid' }) }),
        kategoriAset: zod_1.z.nativeEnum(client_1.KategoriAset).optional(),
        kategoriLiabilitas: zod_1.z.nativeEnum(client_1.KategoriLiabilitas).optional(),
        kategoriEkuitas: zod_1.z.nativeEnum(client_1.KategoriEkuitas).optional(),
        level: zod_1.z.number().int().min(1).max(10).default(1),
        parentId: zod_1.z.string().cuid('Parent ID tidak valid').optional(),
        normalBalance: zod_1.z.enum(['DEBIT', 'KREDIT']).default('DEBIT'),
        isHeader: zod_1.z.boolean().default(false),
        isActive: zod_1.z.boolean().default(true),
        isControlAccount: zod_1.z.boolean().default(false),
        allowManualEntry: zod_1.z.boolean().default(true),
        requireDepartment: zod_1.z.boolean().default(false),
        requireProject: zod_1.z.boolean().default(false),
        requireCostCenter: zod_1.z.boolean().default(false),
        multiCurrency: zod_1.z.boolean().default(false),
        mataUangDefault: zod_1.z.string().optional(),
        saldoAwal: zod_1.z.number().default(0),
        saldoAwalDebit: zod_1.z.number().default(0),
        saldoAwalKredit: zod_1.z.number().default(0),
        pajakId: zod_1.z.string().cuid().optional(),
        catatan: zod_1.z.string().optional(),
    }),
});
// Update COA schema
exports.updateCoaSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('COA ID tidak valid'),
    }),
    body: zod_1.z.object({
        namaAkun: zod_1.z.string().min(1, 'Nama akun wajib diisi').max(200).optional(),
        kategoriAset: zod_1.z.nativeEnum(client_1.KategoriAset).optional(),
        kategoriLiabilitas: zod_1.z.nativeEnum(client_1.KategoriLiabilitas).optional(),
        kategoriEkuitas: zod_1.z.nativeEnum(client_1.KategoriEkuitas).optional(),
        normalBalance: zod_1.z.enum(['DEBIT', 'KREDIT']).optional(),
        isActive: zod_1.z.boolean().optional(),
        isControlAccount: zod_1.z.boolean().optional(),
        allowManualEntry: zod_1.z.boolean().optional(),
        requireDepartment: zod_1.z.boolean().optional(),
        requireProject: zod_1.z.boolean().optional(),
        requireCostCenter: zod_1.z.boolean().optional(),
        multiCurrency: zod_1.z.boolean().optional(),
        mataUangDefault: zod_1.z.string().optional(),
        saldoAwal: zod_1.z.number().optional(),
        saldoAwalDebit: zod_1.z.number().optional(),
        saldoAwalKredit: zod_1.z.number().optional(),
        pajakId: zod_1.z.string().cuid().optional().nullable(),
        catatan: zod_1.z.string().optional(),
    }),
});
// Get COA by ID schema
exports.getCoaByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('COA ID tidak valid'),
    }),
});
// List COA schema
exports.listCoaSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('50'),
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid').optional(),
        search: zod_1.z.string().optional(),
        tipe: zod_1.z.nativeEnum(client_1.TipeAkun).optional(),
        kategoriAset: zod_1.z.nativeEnum(client_1.KategoriAset).optional(),
        kategoriLiabilitas: zod_1.z.nativeEnum(client_1.KategoriLiabilitas).optional(),
        kategoriEkuitas: zod_1.z.nativeEnum(client_1.KategoriEkuitas).optional(),
        parentId: zod_1.z.string().cuid().optional(),
        level: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        isHeader: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional(),
        isActive: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional(),
        normalBalance: zod_1.z.enum(['DEBIT', 'KREDIT']).optional(),
    }),
});
// Delete COA schema
exports.deleteCoaSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('COA ID tidak valid'),
    }),
});
// Get COA hierarchy schema
exports.getCoaHierarchySchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        tipe: zod_1.z.nativeEnum(client_1.TipeAkun).optional(),
        includeInactive: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional()
            .default('false'),
    }),
});
// Update COA balance schema
exports.updateCoaBalanceSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('COA ID tidak valid'),
    }),
    body: zod_1.z.object({
        saldoAwal: zod_1.z.number().optional(),
        saldoAwalDebit: zod_1.z.number().optional(),
        saldoAwalKredit: zod_1.z.number().optional(),
    }),
});

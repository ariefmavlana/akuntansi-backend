"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBranchSchema = exports.listBranchesSchema = exports.getBranchByIdSchema = exports.updateBranchSchema = exports.createBranchSchema = exports.deleteCompanySchema = exports.listCompaniesSchema = exports.getCompanyByIdSchema = exports.updateCompanySchema = exports.createCompanySchema = void 0;
const zod_1 = require("zod");
// Create company schema
exports.createCompanySchema = zod_1.z.object({
    body: zod_1.z.object({
        kode: zod_1.z
            .string()
            .min(2, 'Kode perusahaan minimal 2 karakter')
            .max(10, 'Kode perusahaan maksimal 10 karakter')
            .regex(/^[A-Z0-9]+$/, 'Kode hanya boleh huruf besar dan angka'),
        nama: zod_1.z.string().min(1, 'Nama perusahaan wajib diisi'),
        namaLengkap: zod_1.z.string().optional(),
        bentukUsaha: zod_1.z.string().optional(),
        bidangUsaha: zod_1.z.string().optional(),
        alamat: zod_1.z.string().optional(),
        kelurahan: zod_1.z.string().optional(),
        kecamatan: zod_1.z.string().optional(),
        kota: zod_1.z.string().optional(),
        provinsi: zod_1.z.string().optional(),
        kodePos: zod_1.z.string().optional(),
        telepon: zod_1.z.string().optional(),
        fax: zod_1.z.string().optional(),
        email: zod_1.z.string().email('Email tidak valid').optional(),
        website: zod_1.z.string().url('URL website tidak valid').optional(),
        npwp: zod_1.z
            .string()
            .regex(/^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/, 'Format NPWP tidak valid (XX.XXX.XXX.X-XXX.XXX)')
            .optional(),
        nib: zod_1.z.string().optional(),
        aktaPendirian: zod_1.z.string().optional(),
        skKemenkumham: zod_1.z.string().optional(),
        logo: zod_1.z.string().url('URL logo tidak valid').optional(),
        mataUangUtama: zod_1.z.string().default('IDR'),
        tahunBuku: zod_1.z.number().int().min(1).max(12).default(12),
        satuanUsahaKecil: zod_1.z.boolean().default(false),
        indukId: zod_1.z.string().cuid('Perusahaan induk ID tidak valid').optional(),
    }),
});
// Update company schema
exports.updateCompanySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Company ID tidak valid'),
    }),
    body: zod_1.z.object({
        nama: zod_1.z.string().min(1, 'Nama perusahaan wajib diisi').optional(),
        namaLengkap: zod_1.z.string().optional(),
        bentukUsaha: zod_1.z.string().optional(),
        bidangUsaha: zod_1.z.string().optional(),
        alamat: zod_1.z.string().optional(),
        kelurahan: zod_1.z.string().optional(),
        kecamatan: zod_1.z.string().optional(),
        kota: zod_1.z.string().optional(),
        provinsi: zod_1.z.string().optional(),
        kodePos: zod_1.z.string().optional(),
        telepon: zod_1.z.string().optional(),
        fax: zod_1.z.string().optional(),
        email: zod_1.z.string().email('Email tidak valid').optional(),
        website: zod_1.z.string().url('URL website tidak valid').optional(),
        npwp: zod_1.z
            .string()
            .regex(/^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/, 'Format NPWP tidak valid')
            .optional(),
        nib: zod_1.z.string().optional(),
        aktaPendirian: zod_1.z.string().optional(),
        skKemenkumham: zod_1.z.string().optional(),
        logo: zod_1.z.string().url('URL logo tidak valid').optional(),
        mataUangUtama: zod_1.z.string().optional(),
        tahunBuku: zod_1.z.number().int().min(1).max(12).optional(),
        satuanUsahaKecil: zod_1.z.boolean().optional(),
    }),
});
// Get company by ID schema
exports.getCompanyByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Company ID tidak valid'),
    }),
});
// List companies schema
exports.listCompaniesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
        search: zod_1.z.string().optional(),
        bentukUsaha: zod_1.z.string().optional(),
        bidangUsaha: zod_1.z.string().optional(),
        kota: zod_1.z.string().optional(),
        provinsi: zod_1.z.string().optional(),
    }),
});
// Delete company schema
exports.deleteCompanySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Company ID tidak valid'),
    }),
});
// Create branch schema
exports.createBranchSchema = zod_1.z.object({
    body: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid'),
        kode: zod_1.z
            .string()
            .min(2, 'Kode cabang minimal 2 karakter')
            .max(10, 'Kode cabang maksimal 10 karakter')
            .regex(/^[A-Z0-9]+$/, 'Kode hanya boleh huruf besar dan angka'),
        nama: zod_1.z.string().min(1, 'Nama cabang wajib diisi'),
        alamat: zod_1.z.string().optional(),
        kota: zod_1.z.string().optional(),
        telepon: zod_1.z.string().optional(),
        email: zod_1.z.string().email('Email tidak valid').optional(),
        kepala: zod_1.z.string().optional(),
        isAktif: zod_1.z.boolean().default(true),
        isKantor: zod_1.z.boolean().default(false),
    }),
});
// Update branch schema
exports.updateBranchSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Branch ID tidak valid'),
    }),
    body: zod_1.z.object({
        nama: zod_1.z.string().min(1, 'Nama cabang wajib diisi').optional(),
        alamat: zod_1.z.string().optional(),
        kota: zod_1.z.string().optional(),
        telepon: zod_1.z.string().optional(),
        email: zod_1.z.string().email('Email tidak valid').optional(),
        kepala: zod_1.z.string().optional(),
        isAktif: zod_1.z.boolean().optional(),
        isKantor: zod_1.z.boolean().optional(),
    }),
});
// Get branch by ID schema
exports.getBranchByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Branch ID tidak valid'),
    }),
});
// List branches schema
exports.listBranchesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
        perusahaanId: zod_1.z.string().cuid('Perusahaan ID tidak valid').optional(),
        search: zod_1.z.string().optional(),
        isAktif: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional(),
        kota: zod_1.z.string().optional(),
    }),
});
// Delete branch schema
exports.deleteBranchSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Branch ID tidak valid'),
    }),
});

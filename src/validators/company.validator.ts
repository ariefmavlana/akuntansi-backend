import { z } from 'zod';

// Create company schema
export const createCompanySchema = z.object({
    body: z.object({
        kode: z
            .string()
            .min(2, 'Kode perusahaan minimal 2 karakter')
            .max(10, 'Kode perusahaan maksimal 10 karakter')
            .regex(/^[A-Z0-9]+$/, 'Kode hanya boleh huruf besar dan angka'),
        nama: z.string().min(1, 'Nama perusahaan wajib diisi'),
        namaLengkap: z.string().optional(),
        bentukUsaha: z.string().optional(),
        bidangUsaha: z.string().optional(),
        alamat: z.string().optional(),
        kelurahan: z.string().optional(),
        kecamatan: z.string().optional(),
        kota: z.string().optional(),
        provinsi: z.string().optional(),
        kodePos: z.string().optional(),
        telepon: z.string().optional(),
        fax: z.string().optional(),
        email: z.string().email('Email tidak valid').optional(),
        website: z.string().url('URL website tidak valid').optional(),
        npwp: z
            .string()
            .regex(/^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/, 'Format NPWP tidak valid (XX.XXX.XXX.X-XXX.XXX)')
            .optional(),
        nib: z.string().optional(),
        aktaPendirian: z.string().optional(),
        skKemenkumham: z.string().optional(),
        logo: z.string().url('URL logo tidak valid').optional(),
        mataUangUtama: z.string().default('IDR'),
        tahunBuku: z.number().int().min(1).max(12).default(12),
        satuanUsahaKecil: z.boolean().default(false),
        indukId: z.string().cuid('Perusahaan induk ID tidak valid').optional(),
    }),
});

// Update company schema
export const updateCompanySchema = z.object({
    params: z.object({
        id: z.string().cuid('Company ID tidak valid'),
    }),
    body: z.object({
        nama: z.string().min(1, 'Nama perusahaan wajib diisi').optional(),
        namaLengkap: z.string().optional(),
        bentukUsaha: z.string().optional(),
        bidangUsaha: z.string().optional(),
        alamat: z.string().optional(),
        kelurahan: z.string().optional(),
        kecamatan: z.string().optional(),
        kota: z.string().optional(),
        provinsi: z.string().optional(),
        kodePos: z.string().optional(),
        telepon: z.string().optional(),
        fax: z.string().optional(),
        email: z.string().email('Email tidak valid').optional(),
        website: z.string().url('URL website tidak valid').optional(),
        npwp: z
            .string()
            .regex(/^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/, 'Format NPWP tidak valid')
            .optional(),
        nib: z.string().optional(),
        aktaPendirian: z.string().optional(),
        skKemenkumham: z.string().optional(),
        logo: z.string().url('URL logo tidak valid').optional(),
        mataUangUtama: z.string().optional(),
        tahunBuku: z.number().int().min(1).max(12).optional(),
        satuanUsahaKecil: z.boolean().optional(),
    }),
});

// Get company by ID schema
export const getCompanyByIdSchema = z.object({
    params: z.object({
        id: z.string().cuid('Company ID tidak valid'),
    }),
});

// List companies schema
export const listCompaniesSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
        search: z.string().optional(),
        bentukUsaha: z.string().optional(),
        bidangUsaha: z.string().optional(),
        kota: z.string().optional(),
        provinsi: z.string().optional(),
    }),
});

// Delete company schema
export const deleteCompanySchema = z.object({
    params: z.object({
        id: z.string().cuid('Company ID tidak valid'),
    }),
});

// Create branch schema
export const createBranchSchema = z.object({
    body: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        kode: z
            .string()
            .min(2, 'Kode cabang minimal 2 karakter')
            .max(10, 'Kode cabang maksimal 10 karakter')
            .regex(/^[A-Z0-9]+$/, 'Kode hanya boleh huruf besar dan angka'),
        nama: z.string().min(1, 'Nama cabang wajib diisi'),
        alamat: z.string().optional(),
        kota: z.string().optional(),
        telepon: z.string().optional(),
        email: z.string().email('Email tidak valid').optional(),
        kepala: z.string().optional(),
        isAktif: z.boolean().default(true),
        isKantor: z.boolean().default(false),
    }),
});

// Update branch schema
export const updateBranchSchema = z.object({
    params: z.object({
        id: z.string().cuid('Branch ID tidak valid'),
    }),
    body: z.object({
        nama: z.string().min(1, 'Nama cabang wajib diisi').optional(),
        alamat: z.string().optional(),
        kota: z.string().optional(),
        telepon: z.string().optional(),
        email: z.string().email('Email tidak valid').optional(),
        kepala: z.string().optional(),
        isAktif: z.boolean().optional(),
        isKantor: z.boolean().optional(),
    }),
});

// Get branch by ID schema
export const getBranchByIdSchema = z.object({
    params: z.object({
        id: z.string().cuid('Branch ID tidak valid'),
    }),
});

// List branches schema
export const listBranchesSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid').optional(),
        search: z.string().optional(),
        isAktif: z
            .string()
            .transform((val) => val === 'true')
            .optional(),
        kota: z.string().optional(),
    }),
});

// Delete branch schema
export const deleteBranchSchema = z.object({
    params: z.object({
        id: z.string().cuid('Branch ID tidak valid'),
    }),
});

// TypeScript types
export type CreateCompanyInput = z.infer<typeof createCompanySchema>['body'];
export type UpdateCompanyInput = {
    params: z.infer<typeof updateCompanySchema>['params'];
    body: z.infer<typeof updateCompanySchema>['body'];
};
export type GetCompanyByIdInput = z.infer<typeof getCompanyByIdSchema>['params'];
export type ListCompaniesInput = z.infer<typeof listCompaniesSchema>['query'];
export type DeleteCompanyInput = z.infer<typeof deleteCompanySchema>['params'];

export type CreateBranchInput = z.infer<typeof createBranchSchema>['body'];
export type UpdateBranchInput = {
    params: z.infer<typeof updateBranchSchema>['params'];
    body: z.infer<typeof updateBranchSchema>['body'];
};
export type GetBranchByIdInput = z.infer<typeof getBranchByIdSchema>['params'];
export type ListBranchesInput = z.infer<typeof listBranchesSchema>['query'];
export type DeleteBranchInput = z.infer<typeof deleteBranchSchema>['params'];

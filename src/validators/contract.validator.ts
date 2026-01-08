import { z } from 'zod';

// Create contract schema
export const createContractSchema = z.object({
    body: z.object({
        perusahaanId: z.string().cuid('Perusahaan ID tidak valid'),
        nomorKontrak: z.string().min(1, 'Nomor kontrak wajib diisi'),
        namaKontrak: z.string().min(1, 'Nama kontrak wajib diisi'),
        pihakKedua: z.string().min(1, 'Pihak kedua wajib diisi'),
        tanggalMulai: z.string().datetime().or(z.date()),
        tanggalAkhir: z.string().datetime().or(z.date()),
        nilaiKontrak: z.number().min(0, 'Nilai kontrak harus positif'),
        jenis: z.string().min(1, 'Jenis kontrak wajib diisi'),
        status: z.string().optional().default('AKTIF'),
        deskripsi: z.string().optional(),
    }),
});

// Update contract schema
export const updateContractSchema = z.object({
    params: z.object({
        id: z.string().cuid('Contract ID tidak valid'),
    }),
    body: z.object({
        nomorKontrak: z.string().min(1).optional(),
        namaKontrak: z.string().min(1).optional(),
        pihakKedua: z.string().min(1).optional(),
        tanggalMulai: z.string().datetime().or(z.date()).optional(),
        tanggalAkhir: z.string().datetime().or(z.date()).optional(),
        nilaiKontrak: z.number().min(0).optional(),
        jenis: z.string().min(1).optional(),
        status: z.string().optional(),
        deskripsi: z.string().optional(),
    }),
});

// Get contract by ID schema
export const getContractByIdSchema = z.object({
    params: z.object({
        id: z.string().cuid('Contract ID tidak valid'),
    }),
});

// List contracts schema
export const listContractsSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
        perusahaanId: z.string().cuid().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        jenis: z.string().optional(),
        tanggalMulai: z.string().datetime().or(z.date()).optional(),
        tanggalAkhir: z.string().datetime().or(z.date()).optional(),
    }),
});

// Delete contract schema
export const deleteContractSchema = z.object({
    params: z.object({
        id: z.string().cuid('Contract ID tidak valid'),
    }),
});

// TypeScript types
export type CreateContractInput = z.infer<typeof createContractSchema>['body'];
export type UpdateContractInput = {
    params: z.infer<typeof updateContractSchema>['params'];
    body: z.infer<typeof updateContractSchema>['body'];
};
export type GetContractByIdInput = z.infer<typeof getContractByIdSchema>['params'];
export type ListContractsInput = z.infer<typeof listContractsSchema>['query'];
export type DeleteContractInput = z.infer<typeof deleteContractSchema>['params'];

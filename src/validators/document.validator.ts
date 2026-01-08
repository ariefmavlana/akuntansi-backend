import { z } from 'zod';
import { KategoriDokumen } from '@prisma/client';

// Upload document
export const uploadDocumentSchema = z.object({
    body: z.object({
        transaksiId: z.string().cuid().optional(),
        voucherId: z.string().cuid().optional(),
        asetTetapId: z.string().cuid().optional(),
        nama: z.string().min(1, 'Nama dokumen wajib diisi'),
        kategori: z.nativeEnum(KategoriDokumen).default(KategoriDokumen.LAINNYA),
        deskripsi: z.string().optional(),
        isPublik: z.boolean().default(false),
        tags: z.string().optional(), // Comma-separated tags
    }),
    // File is handled by multer middleware, not Zod
});

// Get documents
export const getDocumentsSchema = z.object({
    query: z.object({
        transaksiId: z.string().cuid().optional(),
        voucherId: z.string().cuid().optional(),
        asetTetapId: z.string().cuid().optional(),
        kategori: z.nativeEnum(KategoriDokumen).optional(),
        search: z.string().optional(),
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});

// Get single document
export const getDocumentSchema = z.object({
    params: z.object({
        id: z.string().cuid(),
    }),
});

// Update document
export const updateDocumentSchema = z.object({
    params: z.object({
        id: z.string().cuid(),
    }),
    body: z.object({
        nama: z.string().min(1).optional(),
        kategori: z.nativeEnum(KategoriDokumen).optional(),
        deskripsi: z.string().optional(),
        isPublik: z.boolean().optional(),
        tags: z.string().optional(),
    }),
});

// Delete document
export const deleteDocumentSchema = z.object({
    params: z.object({
        id: z.string().cuid(),
    }),
});

// Type exports
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>['body'];
export type GetDocumentsInput = z.infer<typeof getDocumentsSchema>['query'];
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>['body'];

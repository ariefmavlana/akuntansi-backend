"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocumentSchema = exports.updateDocumentSchema = exports.getDocumentSchema = exports.getDocumentsSchema = exports.uploadDocumentSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// Upload document
exports.uploadDocumentSchema = zod_1.z.object({
    body: zod_1.z.object({
        transaksiId: zod_1.z.string().cuid().optional(),
        voucherId: zod_1.z.string().cuid().optional(),
        asetTetapId: zod_1.z.string().cuid().optional(),
        nama: zod_1.z.string().min(1, 'Nama dokumen wajib diisi'),
        kategori: zod_1.z.nativeEnum(client_1.KategoriDokumen).default(client_1.KategoriDokumen.LAINNYA),
        deskripsi: zod_1.z.string().optional(),
        isPublik: zod_1.z.boolean().default(false),
        tags: zod_1.z.string().optional(), // Comma-separated tags
    }),
    // File is handled by multer middleware, not Zod
});
// Get documents
exports.getDocumentsSchema = zod_1.z.object({
    query: zod_1.z.object({
        transaksiId: zod_1.z.string().cuid().optional(),
        voucherId: zod_1.z.string().cuid().optional(),
        asetTetapId: zod_1.z.string().cuid().optional(),
        kategori: zod_1.z.nativeEnum(client_1.KategoriDokumen).optional(),
        search: zod_1.z.string().optional(),
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});
// Get single document
exports.getDocumentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid(),
    }),
});
// Update document
exports.updateDocumentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid(),
    }),
    body: zod_1.z.object({
        nama: zod_1.z.string().min(1).optional(),
        kategori: zod_1.z.nativeEnum(client_1.KategoriDokumen).optional(),
        deskripsi: zod_1.z.string().optional(),
        isPublik: zod_1.z.boolean().optional(),
        tags: zod_1.z.string().optional(),
    }),
});
// Delete document
exports.deleteDocumentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid(),
    }),
});

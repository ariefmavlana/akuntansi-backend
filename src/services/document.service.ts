import prisma from '@/config/database';
import fs from 'fs';
import path from 'path';
import { UploadDocumentInput } from '@/validators/document.validator';
import { AuthenticationError, ValidationError } from './auth.service';
import { KategoriDokumen } from '@prisma/client';

export class DocumentService {
    // Upload Document
    async uploadDocument(
        data: UploadDocumentInput,
        file: Express.Multer.File,
        userId: string
    ) {
        // 1. Validate Ownership / Existence of related entities
        if (data.transaksiId) {
            const tx = await prisma.transaksi.findUnique({ where: { id: data.transaksiId } });
            if (!tx) throw new ValidationError('Transaksi tidak ditemukan');
        }
        if (data.voucherId) {
            const voucher = await prisma.voucher.findUnique({ where: { id: data.voucherId } });
            if (!voucher) throw new ValidationError('Voucher tidak ditemukan');
        }
        if (data.asetTetapId) {
            const asset = await prisma.asetTetap.findUnique({ where: { id: data.asetTetapId } });
            if (!asset) throw new ValidationError('Aset tidak ditemukan');
        }

        // 2. Save metadata to DB
        const doc = await prisma.dokumenTransaksi.create({
            data: {
                nama: file.originalname,
                jenisFile: path.extname(file.originalname).substring(1), // Remove dot
                ukuranFile: file.size,
                urlFile: file.path.replace(/\\/g, '/'), // Normalize path for Windows
                kategori: data.kategori as KategoriDokumen,
                deskripsi: data.deskripsi,
                tags: data.tags,
                isPublik: data.isPublik === true,
                transaksiId: data.transaksiId,
                voucherId: data.voucherId,
                asetTetapId: data.asetTetapId,
                uploadedById: userId,
            },
        });

        return doc;
    }

    // Get Document List
    async getDocuments(filters: { transaksiId?: string; voucherId?: string; asetTetapId?: string }) {
        if (!filters.transaksiId && !filters.voucherId && !filters.asetTetapId) {
            throw new ValidationError('Filter entity harus diisi');
        }

        return await prisma.dokumenTransaksi.findMany({
            where: filters,
            orderBy: { createdAt: 'desc' },
            include: {
                uploadedBy: {
                    select: { id: true, namaLengkap: true }
                }
            }
        });
    }

    // Delete Document
    async deleteDocument(id: string, userId: string) {
        const doc = await prisma.dokumenTransaksi.findUnique({ where: { id } });
        if (!doc) throw new ValidationError('Dokumen tidak ditemukan');

        // Check permission (Only uploader or Admin)
        const user = await prisma.pengguna.findUnique({ where: { id: userId } });
        const isAdmin = ['SUPERADMIN', 'ADMIN'].includes(user?.role || '');

        if (doc.uploadedById !== userId && !isAdmin) {
            throw new AuthenticationError('Anda tidak memiliki akses untuk menghapus dokumen ini');
        }

        // 1. Delete file from disk
        const filePath = doc.urlFile;
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                console.error('Failed to unlink file:', err);
                // Continue to delete record even if file deletion fails
            }
        }

        // 2. Delete record from DB
        await prisma.dokumenTransaksi.delete({ where: { id } });

        return { message: 'Dokumen berhasil dihapus' };
    }
}

export const documentService = new DocumentService();

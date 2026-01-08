import prisma from '@/config/database';
import logger from '@/utils/logger';
import { AuthenticationError, ValidationError } from './auth.service';
import type {
    UploadDocumentInput,
    GetDocumentsInput,
    UpdateDocumentInput,
} from '@/validators/document.validator';
import path from 'path';
import fs from 'fs/promises';

export class DocumentService {
    private uploadDir = path.join(process.cwd(), 'uploads');

    constructor() {
        // Ensure upload directory exists
        this.ensureUploadDir();
    }

    private async ensureUploadDir() {
        try {
            await fs.access(this.uploadDir);
        } catch {
            await fs.mkdir(this.uploadDir, { recursive: true });
            logger.info('Upload directory created');
        }
    }

    // Upload document
    async uploadDocument(data: UploadDocumentInput, file: Express.Multer.File, userId: string) {
        const user = await prisma.pengguna.findUnique({ where: { id: userId } });
        if (!user) throw new AuthenticationError('User tidak ditemukan');

        // Validate that at least one reference is provided
        if (!data.transaksiId && !data.voucherId && !data.asetTetapId) {
            throw new ValidationError('Harus terkait dengan transaksi, voucher, atau aset tetap');
        }

        // Store file metadata
        const document = await prisma.dokumenTransaksi.create({
            data: {
                transaksiId: data.transaksiId,
                voucherId: data.voucherId,
                asetTetapId: data.asetTetapId,
                nama: data.nama,
                jenisFile: file.mimetype,
                ukuranFile: file.size,
                urlFile: `/uploads/${file.filename}`,
                kategori: data.kategori || 'LAINNYA',
                deskripsi: data.deskripsi,
                uploadedById: userId,
                isPublik: data.isPublik ?? false,
                tags: data.tags,
            },
        });

        logger.info(`Document uploaded: ${document.id} (${file.originalname})`);
        return document;
    }

    // Get documents with filters
    async getDocuments(filters: GetDocumentsInput) {
        const where: any = {};

        if (filters.transaksiId) where.transaksiId = filters.transaksiId;
        if (filters.voucherId) where.voucherId = filters.voucherId;
        if (filters.asetTetapId) where.asetTetapId = filters.asetTetapId;
        if (filters.kategori) where.kategori = filters.kategori;
        if (filters.search) {
            where.OR = [
                { nama: { contains: filters.search, mode: 'insensitive' } },
                { deskripsi: { contains: filters.search, mode: 'insensitive' } },
                { tags: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.dokumenTransaksi.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    uploadedBy: {
                        select: {
                            namaLengkap: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.dokumenTransaksi.count({ where }),
        ]);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // Get single document
    async getDocument(id: string) {
        const document = await prisma.dokumenTransaksi.findUnique({
            where: { id },
            include: {
                uploadedBy: {
                    select: {
                        namaLengkap: true,
                        email: true,
                    },
                },
                transaksi: {
                    select: {
                        nomorTransaksi: true,
                        tanggal: true,
                        tipe: true,
                    },
                },
                voucher: {
                    select: {
                        nomorVoucher: true,
                        tanggal: true,
                        tipe: true,
                    },
                },
                asetTetap: {
                    select: {
                        kodeAset: true,
                        namaAset: true,
                    },
                },
            },
        });

        if (!document) throw new ValidationError('Dokumen tidak ditemukan');
        return document;
    }

    // Update document metadata
    async updateDocument(id: string, data: UpdateDocumentInput) {
        const existing = await prisma.dokumenTransaksi.findUnique({ where: { id } });
        if (!existing) throw new ValidationError('Dokumen tidak ditemukan');

        const updated = await prisma.dokumenTransaksi.update({
            where: { id },
            data: {
                nama: data.nama,
                kategori: data.kategori,
                deskripsi: data.deskripsi,
                isPublik: data.isPublik,
                tags: data.tags,
            },
        });

        logger.info(`Document updated: ${id}`);
        return updated;
    }

    // Delete document
    async deleteDocument(id: string) {
        const document = await prisma.dokumenTransaksi.findUnique({ where: { id } });
        if (!document) throw new ValidationError('Dokumen tidak ditemukan');

        // Delete physical file
        try {
            const filePath = path.join(process.cwd(), document.urlFile);
            await fs.unlink(filePath);
            logger.info(`File deleted: ${filePath}`);
        } catch (error) {
            logger.warn(`Failed to delete file: ${document.urlFile}`, error);
        }

        // Delete database record
        await prisma.dokumenTransaksi.delete({ where: { id } });
        logger.info(`Document deleted: ${id}`);

        return { message: 'Dokumen berhasil dihapus' };
    }

    // Download document (returns file path)
    async getDocumentPath(id: string, userId: string) {
        const document = await prisma.dokumenTransaksi.findUnique({ where: { id } });
        if (!document) throw new ValidationError('Dokumen tidak ditemukan');

        // Check access rights (public or uploaded by user)
        if (!document.isPublik && document.uploadedById !== userId) {
            const user = await prisma.pengguna.findUnique({ where: { id: userId } });
            // Allow if admin or manager
            if (!user || !['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
                throw new AuthenticationError('Anda tidak memiliki akses ke dokumen ini');
            }
        }

        const filePath = path.join(process.cwd(), document.urlFile);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            throw new ValidationError('File tidak ditemukan di server');
        }

        return { document, filePath };
    }
}

export const documentService = new DocumentService();

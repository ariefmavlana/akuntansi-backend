"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentService = exports.DocumentService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const auth_service_1 = require("./auth.service");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
class DocumentService {
    uploadDir = path_1.default.join(process.cwd(), 'uploads');
    constructor() {
        // Ensure upload directory exists
        this.ensureUploadDir();
    }
    async ensureUploadDir() {
        try {
            await promises_1.default.access(this.uploadDir);
        }
        catch {
            await promises_1.default.mkdir(this.uploadDir, { recursive: true });
            logger_1.default.info('Upload directory created');
        }
    }
    // Upload document
    async uploadDocument(data, file, userId) {
        const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
        if (!user)
            throw new auth_service_1.AuthenticationError('User tidak ditemukan');
        // Validate that at least one reference is provided
        if (!data.transaksiId && !data.voucherId && !data.asetTetapId) {
            throw new auth_service_1.ValidationError('Harus terkait dengan transaksi, voucher, atau aset tetap');
        }
        // Store file metadata
        const document = await database_1.default.dokumenTransaksi.create({
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
        logger_1.default.info(`Document uploaded: ${document.id} (${file.originalname})`);
        return document;
    }
    // Get documents with filters
    async getDocuments(filters) {
        const where = {};
        if (filters.transaksiId)
            where.transaksiId = filters.transaksiId;
        if (filters.voucherId)
            where.voucherId = filters.voucherId;
        if (filters.asetTetapId)
            where.asetTetapId = filters.asetTetapId;
        if (filters.kategori)
            where.kategori = filters.kategori;
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
            database_1.default.dokumenTransaksi.findMany({
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
            database_1.default.dokumenTransaksi.count({ where }),
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
    async getDocument(id) {
        const document = await database_1.default.dokumenTransaksi.findUnique({
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
        if (!document)
            throw new auth_service_1.ValidationError('Dokumen tidak ditemukan');
        return document;
    }
    // Update document metadata
    async updateDocument(id, data) {
        const existing = await database_1.default.dokumenTransaksi.findUnique({ where: { id } });
        if (!existing)
            throw new auth_service_1.ValidationError('Dokumen tidak ditemukan');
        const updated = await database_1.default.dokumenTransaksi.update({
            where: { id },
            data: {
                nama: data.nama,
                kategori: data.kategori,
                deskripsi: data.deskripsi,
                isPublik: data.isPublik,
                tags: data.tags,
            },
        });
        logger_1.default.info(`Document updated: ${id}`);
        return updated;
    }
    // Delete document
    async deleteDocument(id) {
        const document = await database_1.default.dokumenTransaksi.findUnique({ where: { id } });
        if (!document)
            throw new auth_service_1.ValidationError('Dokumen tidak ditemukan');
        // Delete physical file
        try {
            const filePath = path_1.default.join(process.cwd(), document.urlFile);
            await promises_1.default.unlink(filePath);
            logger_1.default.info(`File deleted: ${filePath}`);
        }
        catch (error) {
            logger_1.default.warn(`Failed to delete file: ${document.urlFile}`, error);
        }
        // Delete database record
        await database_1.default.dokumenTransaksi.delete({ where: { id } });
        logger_1.default.info(`Document deleted: ${id}`);
        return { message: 'Dokumen berhasil dihapus' };
    }
    // Download document (returns file path)
    async getDocumentPath(id, userId) {
        const document = await database_1.default.dokumenTransaksi.findUnique({ where: { id } });
        if (!document)
            throw new auth_service_1.ValidationError('Dokumen tidak ditemukan');
        // Check access rights (public or uploaded by user)
        if (!document.isPublik && document.uploadedById !== userId) {
            const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
            // Allow if admin or manager
            if (!user || !['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses ke dokumen ini');
            }
        }
        const filePath = path_1.default.join(process.cwd(), document.urlFile);
        // Check if file exists
        try {
            await promises_1.default.access(filePath);
        }
        catch {
            throw new auth_service_1.ValidationError('File tidak ditemukan di server');
        }
        return { document, filePath };
    }
}
exports.DocumentService = DocumentService;
exports.documentService = new DocumentService();

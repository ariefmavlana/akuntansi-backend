"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentService = exports.DocumentService = void 0;
const database_1 = __importDefault(require("../config/database"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const auth_service_1 = require("./auth.service");
class DocumentService {
    // Upload Document
    async uploadDocument(data, file, userId) {
        // 1. Validate Ownership / Existence of related entities
        if (data.transaksiId) {
            const tx = await database_1.default.transaksi.findUnique({ where: { id: data.transaksiId } });
            if (!tx)
                throw new auth_service_1.ValidationError('Transaksi tidak ditemukan');
        }
        if (data.voucherId) {
            const voucher = await database_1.default.voucher.findUnique({ where: { id: data.voucherId } });
            if (!voucher)
                throw new auth_service_1.ValidationError('Voucher tidak ditemukan');
        }
        if (data.asetTetapId) {
            const asset = await database_1.default.asetTetap.findUnique({ where: { id: data.asetTetapId } });
            if (!asset)
                throw new auth_service_1.ValidationError('Aset tidak ditemukan');
        }
        // 2. Save metadata to DB
        const doc = await database_1.default.dokumenTransaksi.create({
            data: {
                nama: file.originalname,
                jenisFile: path_1.default.extname(file.originalname).substring(1), // Remove dot
                ukuranFile: file.size,
                urlFile: file.path.replace(/\\/g, '/'), // Normalize path for Windows
                kategori: data.kategori,
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
    async getDocuments(filters) {
        if (!filters.transaksiId && !filters.voucherId && !filters.asetTetapId) {
            throw new auth_service_1.ValidationError('Filter entity harus diisi');
        }
        return await database_1.default.dokumenTransaksi.findMany({
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
    async deleteDocument(id, userId) {
        const doc = await database_1.default.dokumenTransaksi.findUnique({ where: { id } });
        if (!doc)
            throw new auth_service_1.ValidationError('Dokumen tidak ditemukan');
        // Check permission (Only uploader or Admin)
        const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
        const isAdmin = ['SUPERADMIN', 'ADMIN'].includes(user?.role || '');
        if (doc.uploadedById !== userId && !isAdmin) {
            throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk menghapus dokumen ini');
        }
        // 1. Delete file from disk
        const filePath = doc.urlFile;
        if (fs_1.default.existsSync(filePath)) {
            try {
                fs_1.default.unlinkSync(filePath);
            }
            catch (err) {
                console.error('Failed to unlink file:', err);
                // Continue to delete record even if file deletion fails
            }
        }
        // 2. Delete record from DB
        await database_1.default.dokumenTransaksi.delete({ where: { id } });
        return { message: 'Dokumen berhasil dihapus' };
    }
}
exports.DocumentService = DocumentService;
exports.documentService = new DocumentService();

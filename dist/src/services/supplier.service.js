"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierService = exports.SupplierService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const auth_service_1 = require("./auth.service");
/**
 * Supplier Service
 * Handles supplier management with payment terms and aging reports
 */
class SupplierService {
    /**
     * Generate supplier code
     */
    async generateSupplierCode(perusahaanId) {
        const count = await database_1.default.pemasok.count({
            where: { perusahaanId },
        });
        const sequence = String(count + 1).padStart(4, '0');
        return `SUPP-${sequence}`;
    }
    /**
     * Create supplier
     */
    async createSupplier(data, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === data.perusahaanId;
            const canCreate = ['ADMIN', 'PURCHASING', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && canCreate)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk membuat pemasok');
            }
            // Generate supplier code if not provided
            const kodePemasok = data.kodePemasok || (await this.generateSupplierCode(data.perusahaanId));
            // Check if supplier code already exists
            const existing = await database_1.default.pemasok.findFirst({
                where: {
                    perusahaanId: data.perusahaanId,
                    kodePemasok,
                },
            });
            if (existing) {
                throw new auth_service_1.ValidationError('Kode pemasok sudah digunakan');
            }
            // Create supplier
            const supplier = await database_1.default.pemasok.create({
                data: {
                    perusahaanId: data.perusahaanId,
                    kodePemasok,
                    nama: data.nama,
                    namaPerusahaan: data.namaPerusahaan,
                    alamat: data.alamat,
                    kota: data.kota,
                    provinsi: data.provinsi,
                    kodePos: data.kodePos,
                    telepon: data.telepon,
                    email: data.email,
                    website: data.website,
                    npwp: data.npwp,
                    kontakPerson: data.kontakPerson,
                    teleponKontak: data.teleponKontak,
                    batasKredit: data.batasKredit || 0,
                    termPembayaran: data.termPembayaran || 30,
                    kategori: data.kategori,
                    nomorRekening: data.nomorRekening,
                    namaBank: data.namaBank,
                    atasNama: data.atasNama,
                    catatan: data.catatan,
                },
            });
            logger_1.default.info(`Supplier created: ${supplier.kodePemasok} by ${requestingUser.email}`);
            return supplier;
        }
        catch (error) {
            logger_1.default.error('Create supplier error:', error);
            throw error;
        }
    }
    /**
     * Get supplier by ID
     */
    async getSupplierById(supplierId, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const supplier = await database_1.default.pemasok.findUnique({
                where: { id: supplierId },
                include: {
                    transaksi: {
                        select: {
                            id: true,
                            nomorTransaksi: true,
                            tanggal: true,
                            total: true,
                            statusPembayaran: true,
                        },
                        orderBy: { tanggal: 'desc' },
                        take: 10,
                    },
                },
            });
            if (!supplier) {
                throw new auth_service_1.ValidationError('Pemasok tidak ditemukan');
            }
            // Check permissions
            if (requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== supplier.perusahaanId) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses ke pemasok ini');
            }
            return supplier;
        }
        catch (error) {
            logger_1.default.error('Get supplier by ID error:', error);
            throw error;
        }
    }
    /**
     * List suppliers with pagination and filters
     */
    async listSuppliers(filters, requestingUserId) {
        try {
            const { page = 1, limit = 20, perusahaanId, search, kategori, isAktif } = filters;
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Build where clause
            const where = {};
            // Non-SUPERADMIN can only see their company's suppliers
            if (requestingUser.role !== 'SUPERADMIN') {
                where.perusahaanId = requestingUser.perusahaanId;
            }
            else if (perusahaanId) {
                where.perusahaanId = perusahaanId;
            }
            if (kategori) {
                where.kategori = kategori;
            }
            if (isAktif !== undefined) {
                where.isAktif = isAktif;
            }
            if (search) {
                where.OR = [
                    { kodePemasok: { contains: search, mode: 'insensitive' } },
                    { nama: { contains: search, mode: 'insensitive' } },
                    { namaPerusahaan: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ];
            }
            // Get total count
            const total = await database_1.default.pemasok.count({ where });
            // Get suppliers
            const suppliers = await database_1.default.pemasok.findMany({
                where,
                select: {
                    id: true,
                    kodePemasok: true,
                    nama: true,
                    namaPerusahaan: true,
                    email: true,
                    telepon: true,
                    batasKredit: true,
                    termPembayaran: true,
                    kategori: true,
                    isAktif: true,
                    createdAt: true,
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { nama: 'asc' },
            });
            return {
                data: suppliers,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            logger_1.default.error('List suppliers error:', error);
            throw error;
        }
    }
    /**
     * Update supplier
     */
    async updateSupplier(supplierId, data, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const supplier = await database_1.default.pemasok.findUnique({
                where: { id: supplierId },
            });
            if (!supplier) {
                throw new auth_service_1.ValidationError('Pemasok tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === supplier.perusahaanId;
            const canUpdate = ['ADMIN', 'PURCHASING', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && canUpdate)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk mengupdate pemasok ini');
            }
            // Update supplier
            const updatedSupplier = await database_1.default.pemasok.update({
                where: { id: supplierId },
                data: {
                    nama: data.nama,
                    namaPerusahaan: data.namaPerusahaan,
                    alamat: data.alamat,
                    kota: data.kota,
                    provinsi: data.provinsi,
                    kodePos: data.kodePos,
                    telepon: data.telepon,
                    email: data.email,
                    website: data.website,
                    npwp: data.npwp,
                    kontakPerson: data.kontakPerson,
                    teleponKontak: data.teleponKontak,
                    batasKredit: data.batasKredit,
                    termPembayaran: data.termPembayaran,
                    kategori: data.kategori,
                    nomorRekening: data.nomorRekening,
                    namaBank: data.namaBank,
                    atasNama: data.atasNama,
                    catatan: data.catatan,
                },
            });
            logger_1.default.info(`Supplier updated: ${updatedSupplier.kodePemasok} by ${requestingUser.email}`);
            return updatedSupplier;
        }
        catch (error) {
            logger_1.default.error('Update supplier error:', error);
            throw error;
        }
    }
    /**
     * Get supplier aging report
     */
    async getSupplierAging(filters, requestingUserId) {
        try {
            const { perusahaanId, supplierId, tanggal } = filters;
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Check permissions
            if (requestingUser.role !== 'SUPERADMIN' && requestingUser.perusahaanId !== perusahaanId) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses ke data perusahaan ini');
            }
            const asOfDate = tanggal ? (typeof tanggal === 'string' ? new Date(tanggal) : tanggal) : new Date();
            // Build where clause
            const where = {
                perusahaanId,
                statusPembayaran: { not: 'LUNAS' },
                tanggalJatuhTempo: { lte: asOfDate },
            };
            if (supplierId) {
                where.pemasokId = supplierId;
            }
            // Get unpaid transactions
            const transactions = await database_1.default.transaksi.findMany({
                where,
                include: {
                    pemasok: {
                        select: {
                            id: true,
                            kodePemasok: true,
                            nama: true,
                            batasKredit: true,
                        },
                    },
                },
                orderBy: { tanggalJatuhTempo: 'asc' },
            });
            // Group by supplier and calculate aging
            const agingBySupplier = transactions.reduce((acc, trans) => {
                if (!trans.pemasok)
                    return acc;
                const key = trans.pemasok.id;
                if (!acc[key]) {
                    acc[key] = {
                        supplier: trans.pemasok,
                        current: 0,
                        days1to30: 0,
                        days31to60: 0,
                        days61to90: 0,
                        over90: 0,
                        total: 0,
                    };
                }
                const daysOverdue = Math.floor((asOfDate.getTime() - trans.tanggalJatuhTempo.getTime()) / (1000 * 60 * 60 * 24));
                const amount = trans.sisaPembayaran.toNumber();
                if (daysOverdue <= 0) {
                    acc[key].current += amount;
                }
                else if (daysOverdue <= 30) {
                    acc[key].days1to30 += amount;
                }
                else if (daysOverdue <= 60) {
                    acc[key].days31to60 += amount;
                }
                else if (daysOverdue <= 90) {
                    acc[key].days61to90 += amount;
                }
                else {
                    acc[key].over90 += amount;
                }
                acc[key].total += amount;
                return acc;
            }, {});
            return Object.values(agingBySupplier);
        }
        catch (error) {
            logger_1.default.error('Get supplier aging error:', error);
            throw error;
        }
    }
    /**
     * Toggle supplier status (activate/deactivate)
     */
    async toggleSupplierStatus(supplierId, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const supplier = await database_1.default.pemasok.findUnique({
                where: { id: supplierId },
            });
            if (!supplier) {
                throw new auth_service_1.ValidationError('Pemasok tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === supplier.perusahaanId;
            const canUpdate = ['ADMIN'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && canUpdate)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk mengubah status pemasok');
            }
            // Toggle status
            const updatedSupplier = await database_1.default.pemasok.update({
                where: { id: supplierId },
                data: {
                    isAktif: !supplier.isAktif,
                },
            });
            logger_1.default.info(`Supplier status toggled: ${updatedSupplier.kodePemasok} -> ${updatedSupplier.isAktif} by ${requestingUser.email}`);
            return updatedSupplier;
        }
        catch (error) {
            logger_1.default.error('Toggle supplier status error:', error);
            throw error;
        }
    }
    /**
     * Delete supplier
     */
    async deleteSupplier(supplierId, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const supplier = await database_1.default.pemasok.findUnique({
                where: { id: supplierId },
                include: {
                    transaksi: true,
                },
            });
            if (!supplier) {
                throw new auth_service_1.ValidationError('Pemasok tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === supplier.perusahaanId;
            const canDelete = ['ADMIN'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && canDelete)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk menghapus pemasok ini');
            }
            // Cannot delete if has transactions
            if (supplier.transaksi.length > 0) {
                throw new auth_service_1.ValidationError('Tidak dapat menghapus pemasok yang sudah memiliki transaksi. Nonaktifkan saja.');
            }
            // Delete supplier
            await database_1.default.pemasok.delete({
                where: { id: supplierId },
            });
            logger_1.default.info(`Supplier deleted: ${supplier.kodePemasok} by ${requestingUser.email}`);
        }
        catch (error) {
            logger_1.default.error('Delete supplier error:', error);
            throw error;
        }
    }
}
exports.SupplierService = SupplierService;
// Export singleton instance
exports.supplierService = new SupplierService();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyService = exports.CompanyService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const auth_service_1 = require("./auth.service");
/**
 * Company Service
 * Handles company and branch management business logic
 */
class CompanyService {
    /**
     * Create new company
     */
    async createCompany(data, requestingUserId) {
        try {
            // Get requesting user
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Only SUPERADMIN can create companies
            if (requestingUser.role !== 'SUPERADMIN') {
                throw new auth_service_1.AuthenticationError('Hanya SUPERADMIN yang dapat membuat perusahaan baru');
            }
            // Check if kode already exists
            const existingKode = await database_1.default.perusahaan.findUnique({
                where: { kode: data.kode },
            });
            if (existingKode) {
                throw new auth_service_1.ValidationError('Kode perusahaan sudah digunakan');
            }
            // Verify parent company if provided
            if (data.indukId) {
                const parentCompany = await database_1.default.perusahaan.findUnique({
                    where: { id: data.indukId },
                });
                if (!parentCompany) {
                    throw new auth_service_1.ValidationError('Perusahaan induk tidak ditemukan');
                }
            }
            // Create company
            const company = await database_1.default.perusahaan.create({
                data: {
                    kode: data.kode,
                    nama: data.nama,
                    namaLengkap: data.namaLengkap,
                    bentukUsaha: data.bentukUsaha,
                    bidangUsaha: data.bidangUsaha,
                    alamat: data.alamat,
                    kelurahan: data.kelurahan,
                    kecamatan: data.kecamatan,
                    kota: data.kota,
                    provinsi: data.provinsi,
                    kodePos: data.kodePos,
                    telepon: data.telepon,
                    fax: data.fax,
                    email: data.email,
                    website: data.website,
                    npwp: data.npwp,
                    nib: data.nib,
                    aktaPendirian: data.aktaPendirian,
                    skKemenkumham: data.skKemenkumham,
                    logo: data.logo,
                    mataUangUtama: data.mataUangUtama || 'IDR',
                    tahunBuku: data.tahunBuku || 12,
                    satuanUsahaKecil: data.satuanUsahaKecil || false,
                    indukId: data.indukId,
                },
            });
            logger_1.default.info(`Company created: ${company.nama} by ${requestingUser.email}`);
            return company;
        }
        catch (error) {
            logger_1.default.error('Create company error:', error);
            throw error;
        }
    }
    /**
     * Get company by ID
     */
    async getCompanyById(companyId, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const company = await database_1.default.perusahaan.findUnique({
                where: { id: companyId },
                include: {
                    induk: {
                        select: {
                            id: true,
                            kode: true,
                            nama: true,
                        },
                    },
                    anak: {
                        select: {
                            id: true,
                            kode: true,
                            nama: true,
                        },
                    },
                    cabang: {
                        select: {
                            id: true,
                            kode: true,
                            nama: true,
                            kota: true,
                            isAktif: true,
                        },
                    },
                    _count: {
                        select: {
                            pengguna: true,
                            coa: true,
                            transaksi: true,
                        },
                    },
                },
            });
            if (!company) {
                throw new auth_service_1.ValidationError('Perusahaan tidak ditemukan');
            }
            // Non-SUPERADMIN can only view their own company
            if (requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== companyId) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses ke perusahaan ini');
            }
            return company;
        }
        catch (error) {
            logger_1.default.error('Get company by ID error:', error);
            throw error;
        }
    }
    /**
     * List companies with pagination and filters
     */
    async listCompanies(filters, requestingUserId) {
        try {
            const { page = 1, limit = 10, search, bentukUsaha, bidangUsaha, kota, provinsi } = filters;
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Build where clause
            const where = {};
            // Non-SUPERADMIN can only see their own company
            if (requestingUser.role !== 'SUPERADMIN') {
                where.id = requestingUser.perusahaanId;
            }
            if (bentukUsaha) {
                where.bentukUsaha = bentukUsaha;
            }
            if (bidangUsaha) {
                where.bidangUsaha = { contains: bidangUsaha, mode: 'insensitive' };
            }
            if (kota) {
                where.kota = { contains: kota, mode: 'insensitive' };
            }
            if (provinsi) {
                where.provinsi = { contains: provinsi, mode: 'insensitive' };
            }
            if (search) {
                where.OR = [
                    { nama: { contains: search, mode: 'insensitive' } },
                    { kode: { contains: search, mode: 'insensitive' } },
                    { npwp: { contains: search, mode: 'insensitive' } },
                ];
            }
            // Get total count
            const total = await database_1.default.perusahaan.count({ where });
            // Get companies
            const companies = await database_1.default.perusahaan.findMany({
                where,
                select: {
                    id: true,
                    kode: true,
                    nama: true,
                    namaLengkap: true,
                    bentukUsaha: true,
                    bidangUsaha: true,
                    kota: true,
                    provinsi: true,
                    npwp: true,
                    logo: true,
                    mataUangUtama: true,
                    createdAt: true,
                    _count: {
                        select: {
                            pengguna: true,
                            cabang: true,
                        },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            });
            return {
                data: companies,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            logger_1.default.error('List companies error:', error);
            throw error;
        }
    }
    /**
     * Update company
     */
    async updateCompany(companyId, data, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const company = await database_1.default.perusahaan.findUnique({
                where: { id: companyId },
            });
            if (!company) {
                throw new auth_service_1.ValidationError('Perusahaan tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === companyId;
            const isAdmin = requestingUser.role === 'ADMIN';
            if (!isSuperAdmin && !(isOwnCompany && isAdmin)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk mengupdate perusahaan ini');
            }
            // Update company
            const updatedCompany = await database_1.default.perusahaan.update({
                where: { id: companyId },
                data,
            });
            logger_1.default.info(`Company updated: ${updatedCompany.nama} by ${requestingUser.email}`);
            return updatedCompany;
        }
        catch (error) {
            logger_1.default.error('Update company error:', error);
            throw error;
        }
    }
    /**
     * Delete company (soft delete by deactivating all users)
     */
    async deleteCompany(companyId, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Only SUPERADMIN can delete companies
            if (requestingUser.role !== 'SUPERADMIN') {
                throw new auth_service_1.AuthenticationError('Hanya SUPERADMIN yang dapat menghapus perusahaan');
            }
            const company = await database_1.default.perusahaan.findUnique({
                where: { id: companyId },
                include: {
                    _count: {
                        select: {
                            transaksi: true,
                            voucher: true,
                        },
                    },
                },
            });
            if (!company) {
                throw new auth_service_1.ValidationError('Perusahaan tidak ditemukan');
            }
            // Check if company has transactions
            if (company._count.transaksi > 0 || company._count.voucher > 0) {
                throw new auth_service_1.ValidationError('Perusahaan tidak dapat dihapus karena memiliki transaksi. Nonaktifkan user sebagai gantinya.');
            }
            // Deactivate all users in the company
            await database_1.default.pengguna.updateMany({
                where: { perusahaanId: companyId },
                data: { isAktif: false },
            });
            logger_1.default.info(`Company users deactivated: ${company.nama} by ${requestingUser.email}`);
        }
        catch (error) {
            logger_1.default.error('Delete company error:', error);
            throw error;
        }
    }
    // ============================================================================
    // BRANCH MANAGEMENT
    // ============================================================================
    /**
     * Create new branch
     */
    async createBranch(data, requestingUserId) {
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
            const isAdmin = ['ADMIN', 'MANAGER'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && isAdmin)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk membuat cabang');
            }
            // Verify company exists
            const company = await database_1.default.perusahaan.findUnique({
                where: { id: data.perusahaanId },
            });
            if (!company) {
                throw new auth_service_1.ValidationError('Perusahaan tidak ditemukan');
            }
            // Check if kode already exists for this company
            const existingKode = await database_1.default.cabang.findFirst({
                where: {
                    perusahaanId: data.perusahaanId,
                    kode: data.kode,
                },
            });
            if (existingKode) {
                throw new auth_service_1.ValidationError('Kode cabang sudah digunakan untuk perusahaan ini');
            }
            // Create branch
            const branch = await database_1.default.cabang.create({
                data: {
                    perusahaanId: data.perusahaanId,
                    kode: data.kode,
                    nama: data.nama,
                    alamat: data.alamat,
                    kota: data.kota,
                    telepon: data.telepon,
                    email: data.email,
                    kepala: data.kepala,
                    isAktif: data.isAktif ?? true,
                    isKantor: data.isKantor ?? false,
                },
            });
            logger_1.default.info(`Branch created: ${branch.nama} by ${requestingUser.email}`);
            return branch;
        }
        catch (error) {
            logger_1.default.error('Create branch error:', error);
            throw error;
        }
    }
    /**
     * Get branch by ID
     */
    async getBranchById(branchId, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const branch = await database_1.default.cabang.findUnique({
                where: { id: branchId },
                include: {
                    perusahaan: {
                        select: {
                            id: true,
                            kode: true,
                            nama: true,
                        },
                    },
                    _count: {
                        select: {
                            pengguna: true,
                            transaksi: true,
                        },
                    },
                },
            });
            if (!branch) {
                throw new auth_service_1.ValidationError('Cabang tidak ditemukan');
            }
            // Check permissions
            if (requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== branch.perusahaanId) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses ke cabang ini');
            }
            return branch;
        }
        catch (error) {
            logger_1.default.error('Get branch by ID error:', error);
            throw error;
        }
    }
    /**
     * List branches with pagination and filters
     */
    async listBranches(filters, requestingUserId) {
        try {
            const { page = 1, limit = 10, perusahaanId, search, isAktif, kota } = filters;
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Build where clause
            const where = {};
            // Non-SUPERADMIN can only see branches from their company
            if (requestingUser.role !== 'SUPERADMIN') {
                where.perusahaanId = requestingUser.perusahaanId;
            }
            else if (perusahaanId) {
                where.perusahaanId = perusahaanId;
            }
            if (isAktif !== undefined) {
                where.isAktif = isAktif;
            }
            if (kota) {
                where.kota = { contains: kota, mode: 'insensitive' };
            }
            if (search) {
                where.OR = [
                    { nama: { contains: search, mode: 'insensitive' } },
                    { kode: { contains: search, mode: 'insensitive' } },
                ];
            }
            // Get total count
            const total = await database_1.default.cabang.count({ where });
            // Get branches
            const branches = await database_1.default.cabang.findMany({
                where,
                select: {
                    id: true,
                    kode: true,
                    nama: true,
                    alamat: true,
                    kota: true,
                    telepon: true,
                    email: true,
                    kepala: true,
                    isAktif: true,
                    isKantor: true,
                    createdAt: true,
                    perusahaan: {
                        select: {
                            id: true,
                            kode: true,
                            nama: true,
                        },
                    },
                    _count: {
                        select: {
                            pengguna: true,
                        },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            });
            return {
                data: branches,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            logger_1.default.error('List branches error:', error);
            throw error;
        }
    }
    /**
     * Update branch
     */
    async updateBranch(branchId, data, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const branch = await database_1.default.cabang.findUnique({
                where: { id: branchId },
            });
            if (!branch) {
                throw new auth_service_1.ValidationError('Cabang tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === branch.perusahaanId;
            const isAdmin = ['ADMIN', 'MANAGER'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && isAdmin)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk mengupdate cabang ini');
            }
            // Update branch
            const updatedBranch = await database_1.default.cabang.update({
                where: { id: branchId },
                data,
            });
            logger_1.default.info(`Branch updated: ${updatedBranch.nama} by ${requestingUser.email}`);
            return updatedBranch;
        }
        catch (error) {
            logger_1.default.error('Update branch error:', error);
            throw error;
        }
    }
    /**
     * Delete branch
     */
    async deleteBranch(branchId, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const branch = await database_1.default.cabang.findUnique({
                where: { id: branchId },
                include: {
                    _count: {
                        select: {
                            pengguna: true,
                            transaksi: true,
                        },
                    },
                },
            });
            if (!branch) {
                throw new auth_service_1.ValidationError('Cabang tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === branch.perusahaanId;
            const isAdmin = requestingUser.role === 'ADMIN';
            if (!isSuperAdmin && !(isOwnCompany && isAdmin)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk menghapus cabang ini');
            }
            // Check if branch has users or transactions
            if (branch._count.pengguna > 0 || branch._count.transaksi > 0) {
                throw new auth_service_1.ValidationError('Cabang tidak dapat dihapus karena memiliki user atau transaksi. Nonaktifkan cabang sebagai gantinya.');
            }
            // Delete branch
            await database_1.default.cabang.delete({
                where: { id: branchId },
            });
            logger_1.default.info(`Branch deleted: ${branch.nama} by ${requestingUser.email}`);
        }
        catch (error) {
            logger_1.default.error('Delete branch error:', error);
            throw error;
        }
    }
}
exports.CompanyService = CompanyService;
// Export singleton instance
exports.companyService = new CompanyService();

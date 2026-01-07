import prisma from '@/config/database';
import logger from '@/utils/logger';
import { Perusahaan, Cabang } from '@prisma/client';
import type {
    CreateCompanyInput,
    UpdateCompanyInput,
    ListCompaniesInput,
    CreateBranchInput,
    UpdateBranchInput,
    ListBranchesInput,
} from '@/validators/company.validator';
import { AuthenticationError, ValidationError } from './auth.service';

/**
 * Company Service
 * Handles company and branch management business logic
 */
export class CompanyService {
    /**
     * Create new company
     */
    async createCompany(data: CreateCompanyInput, requestingUserId: string): Promise<Perusahaan> {
        try {
            // Get requesting user
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Only SUPERADMIN can create companies
            if (requestingUser.role !== 'SUPERADMIN') {
                throw new AuthenticationError('Hanya SUPERADMIN yang dapat membuat perusahaan baru');
            }

            // Check if kode already exists
            const existingKode = await prisma.perusahaan.findUnique({
                where: { kode: data.kode },
            });

            if (existingKode) {
                throw new ValidationError('Kode perusahaan sudah digunakan');
            }

            // Verify parent company if provided
            if (data.indukId) {
                const parentCompany = await prisma.perusahaan.findUnique({
                    where: { id: data.indukId },
                });

                if (!parentCompany) {
                    throw new ValidationError('Perusahaan induk tidak ditemukan');
                }
            }

            // Create company
            const company = await prisma.perusahaan.create({
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

            logger.info(`Company created: ${company.nama} by ${requestingUser.email}`);

            return company;
        } catch (error) {
            logger.error('Create company error:', error);
            throw error;
        }
    }

    /**
     * Get company by ID
     */
    async getCompanyById(companyId: string, requestingUserId: string): Promise<Perusahaan> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const company = await prisma.perusahaan.findUnique({
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
                throw new ValidationError('Perusahaan tidak ditemukan');
            }

            // Non-SUPERADMIN can only view their own company
            if (
                requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== companyId
            ) {
                throw new AuthenticationError('Anda tidak memiliki akses ke perusahaan ini');
            }

            return company;
        } catch (error) {
            logger.error('Get company by ID error:', error);
            throw error;
        }
    }

    /**
     * List companies with pagination and filters
     */
    async listCompanies(filters: ListCompaniesInput, requestingUserId: string) {
        try {
            const { page = 1, limit = 10, search, bentukUsaha, bidangUsaha, kota, provinsi } = filters;

            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Build where clause
            const where: any = {};

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
            const total = await prisma.perusahaan.count({ where });

            // Get companies
            const companies = await prisma.perusahaan.findMany({
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
        } catch (error) {
            logger.error('List companies error:', error);
            throw error;
        }
    }

    /**
     * Update company
     */
    async updateCompany(
        companyId: string,
        data: UpdateCompanyInput['body'],
        requestingUserId: string
    ): Promise<Perusahaan> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const company = await prisma.perusahaan.findUnique({
                where: { id: companyId },
            });

            if (!company) {
                throw new ValidationError('Perusahaan tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === companyId;
            const isAdmin = requestingUser.role === 'ADMIN';

            if (!isSuperAdmin && !(isOwnCompany && isAdmin)) {
                throw new AuthenticationError(
                    'Anda tidak memiliki akses untuk mengupdate perusahaan ini'
                );
            }

            // Update company
            const updatedCompany = await prisma.perusahaan.update({
                where: { id: companyId },
                data,
            });

            logger.info(`Company updated: ${updatedCompany.nama} by ${requestingUser.email}`);

            return updatedCompany;
        } catch (error) {
            logger.error('Update company error:', error);
            throw error;
        }
    }

    /**
     * Delete company (soft delete by deactivating all users)
     */
    async deleteCompany(companyId: string, requestingUserId: string): Promise<void> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Only SUPERADMIN can delete companies
            if (requestingUser.role !== 'SUPERADMIN') {
                throw new AuthenticationError('Hanya SUPERADMIN yang dapat menghapus perusahaan');
            }

            const company = await prisma.perusahaan.findUnique({
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
                throw new ValidationError('Perusahaan tidak ditemukan');
            }

            // Check if company has transactions
            if (company._count.transaksi > 0 || company._count.voucher > 0) {
                throw new ValidationError(
                    'Perusahaan tidak dapat dihapus karena memiliki transaksi. Nonaktifkan user sebagai gantinya.'
                );
            }

            // Deactivate all users in the company
            await prisma.pengguna.updateMany({
                where: { perusahaanId: companyId },
                data: { isAktif: false },
            });

            logger.info(`Company users deactivated: ${company.nama} by ${requestingUser.email}`);
        } catch (error) {
            logger.error('Delete company error:', error);
            throw error;
        }
    }

    // ============================================================================
    // BRANCH MANAGEMENT
    // ============================================================================

    /**
     * Create new branch
     */
    async createBranch(data: CreateBranchInput, requestingUserId: string): Promise<Cabang> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === data.perusahaanId;
            const isAdmin = ['ADMIN', 'MANAGER'].includes(requestingUser.role);

            if (!isSuperAdmin && !(isOwnCompany && isAdmin)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk membuat cabang');
            }

            // Verify company exists
            const company = await prisma.perusahaan.findUnique({
                where: { id: data.perusahaanId },
            });

            if (!company) {
                throw new ValidationError('Perusahaan tidak ditemukan');
            }

            // Check if kode already exists for this company
            const existingKode = await prisma.cabang.findFirst({
                where: {
                    perusahaanId: data.perusahaanId,
                    kode: data.kode,
                },
            });

            if (existingKode) {
                throw new ValidationError('Kode cabang sudah digunakan untuk perusahaan ini');
            }

            // Create branch
            const branch = await prisma.cabang.create({
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

            logger.info(`Branch created: ${branch.nama} by ${requestingUser.email}`);

            return branch;
        } catch (error) {
            logger.error('Create branch error:', error);
            throw error;
        }
    }

    /**
     * Get branch by ID
     */
    async getBranchById(branchId: string, requestingUserId: string): Promise<Cabang> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const branch = await prisma.cabang.findUnique({
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
                throw new ValidationError('Cabang tidak ditemukan');
            }

            // Check permissions
            if (
                requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== branch.perusahaanId
            ) {
                throw new AuthenticationError('Anda tidak memiliki akses ke cabang ini');
            }

            return branch;
        } catch (error) {
            logger.error('Get branch by ID error:', error);
            throw error;
        }
    }

    /**
     * List branches with pagination and filters
     */
    async listBranches(filters: ListBranchesInput, requestingUserId: string) {
        try {
            const { page = 1, limit = 10, perusahaanId, search, isAktif, kota } = filters;

            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Build where clause
            const where: any = {};

            // Non-SUPERADMIN can only see branches from their company
            if (requestingUser.role !== 'SUPERADMIN') {
                where.perusahaanId = requestingUser.perusahaanId;
            } else if (perusahaanId) {
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
            const total = await prisma.cabang.count({ where });

            // Get branches
            const branches = await prisma.cabang.findMany({
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
        } catch (error) {
            logger.error('List branches error:', error);
            throw error;
        }
    }

    /**
     * Update branch
     */
    async updateBranch(
        branchId: string,
        data: UpdateBranchInput['body'],
        requestingUserId: string
    ): Promise<Cabang> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const branch = await prisma.cabang.findUnique({
                where: { id: branchId },
            });

            if (!branch) {
                throw new ValidationError('Cabang tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === branch.perusahaanId;
            const isAdmin = ['ADMIN', 'MANAGER'].includes(requestingUser.role);

            if (!isSuperAdmin && !(isOwnCompany && isAdmin)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk mengupdate cabang ini');
            }

            // Update branch
            const updatedBranch = await prisma.cabang.update({
                where: { id: branchId },
                data,
            });

            logger.info(`Branch updated: ${updatedBranch.nama} by ${requestingUser.email}`);

            return updatedBranch;
        } catch (error) {
            logger.error('Update branch error:', error);
            throw error;
        }
    }

    /**
     * Delete branch
     */
    async deleteBranch(branchId: string, requestingUserId: string): Promise<void> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const branch = await prisma.cabang.findUnique({
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
                throw new ValidationError('Cabang tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === branch.perusahaanId;
            const isAdmin = requestingUser.role === 'ADMIN';

            if (!isSuperAdmin && !(isOwnCompany && isAdmin)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk menghapus cabang ini');
            }

            // Check if branch has users or transactions
            if (branch._count.pengguna > 0 || branch._count.transaksi > 0) {
                throw new ValidationError(
                    'Cabang tidak dapat dihapus karena memiliki user atau transaksi. Nonaktifkan cabang sebagai gantinya.'
                );
            }

            // Delete branch
            await prisma.cabang.delete({
                where: { id: branchId },
            });

            logger.info(`Branch deleted: ${branch.nama} by ${requestingUser.email}`);
        } catch (error) {
            logger.error('Delete branch error:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const companyService = new CompanyService();

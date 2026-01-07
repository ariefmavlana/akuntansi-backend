import prisma from '@/config/database';
import logger from '@/utils/logger';
import { ChartOfAccounts, TipeAkun } from '@prisma/client';
import type {
    CreateCoaInput,
    UpdateCoaInput,
    ListCoaInput,
    GetCoaHierarchyInput,
    UpdateCoaBalanceInput,
} from '@/validators/coa.validator';
import { AuthenticationError, ValidationError } from './auth.service';

/**
 * Chart of Accounts Service
 * Handles COA management with hierarchy support
 */
export class CoaService {
    /**
     * Create new account
     */
    async createAccount(data: CreateCoaInput, requestingUserId: string): Promise<ChartOfAccounts> {
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
            const isAdmin = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);

            if (!isSuperAdmin && !(isOwnCompany && isAdmin)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk membuat akun');
            }

            // Check if kodeAkun already exists for this company
            const existingKode = await prisma.chartOfAccounts.findFirst({
                where: {
                    perusahaanId: data.perusahaanId,
                    kodeAkun: data.kodeAkun,
                },
            });

            if (existingKode) {
                throw new ValidationError('Kode akun sudah digunakan untuk perusahaan ini');
            }

            // Verify parent account if provided
            if (data.parentId) {
                const parentAccount = await prisma.chartOfAccounts.findUnique({
                    where: { id: data.parentId },
                });

                if (!parentAccount || parentAccount.perusahaanId !== data.perusahaanId) {
                    throw new ValidationError('Parent account tidak valid');
                }

                // Parent must be same type
                if (parentAccount.tipe !== data.tipe) {
                    throw new ValidationError('Parent account harus memiliki tipe yang sama');
                }

                // Parent must be header
                if (!parentAccount.isHeader) {
                    throw new ValidationError('Parent account harus berupa header');
                }

                // Set level based on parent
                data.level = parentAccount.level + 1;
            }

            // Header accounts cannot have manual entries
            if (data.isHeader) {
                data.allowManualEntry = false;
            }

            // Validate kategori based on tipe
            if (data.tipe === TipeAkun.ASET && !data.kategoriAset) {
                throw new ValidationError('Kategori aset wajib diisi untuk akun tipe ASET');
            }
            if (data.tipe === TipeAkun.LIABILITAS && !data.kategoriLiabilitas) {
                throw new ValidationError('Kategori liabilitas wajib diisi untuk akun tipe LIABILITAS');
            }
            if (data.tipe === TipeAkun.EKUITAS && !data.kategoriEkuitas) {
                throw new ValidationError('Kategori ekuitas wajib diisi untuk akun tipe EKUITAS');
            }

            // Create account
            const account = await prisma.chartOfAccounts.create({
                data: {
                    perusahaanId: data.perusahaanId,
                    kodeAkun: data.kodeAkun,
                    namaAkun: data.namaAkun,
                    tipe: data.tipe,
                    kategoriAset: data.kategoriAset,
                    kategoriLiabilitas: data.kategoriLiabilitas,
                    kategoriEkuitas: data.kategoriEkuitas,
                    level: data.level,
                    parentId: data.parentId,
                    normalBalance: data.normalBalance,
                    isHeader: data.isHeader,
                    isActive: data.isActive,
                    isControlAccount: data.isControlAccount,
                    allowManualEntry: data.allowManualEntry,
                    requireDepartment: data.requireDepartment,
                    requireProject: data.requireProject,
                    requireCostCenter: data.requireCostCenter,
                    multiCurrency: data.multiCurrency,
                    mataUangDefault: data.mataUangDefault,
                    saldoAwal: data.saldoAwal,
                    saldoAwalDebit: data.saldoAwalDebit,
                    saldoAwalKredit: data.saldoAwalKredit,
                    saldoBerjalan: data.saldoAwal,
                    pajakId: data.pajakId,
                    catatan: data.catatan,
                },
            });

            logger.info(`COA created: ${account.kodeAkun} - ${account.namaAkun} by ${requestingUser.email}`);

            return account;
        } catch (error) {
            logger.error('Create COA error:', error);
            throw error;
        }
    }

    /**
     * Get account by ID
     */
    async getAccountById(accountId: string, requestingUserId: string): Promise<ChartOfAccounts> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const account = await prisma.chartOfAccounts.findUnique({
                where: { id: accountId },
                include: {
                    parent: {
                        select: {
                            id: true,
                            kodeAkun: true,
                            namaAkun: true,
                        },
                    },
                    children: {
                        select: {
                            id: true,
                            kodeAkun: true,
                            namaAkun: true,
                            isActive: true,
                        },
                    },
                    _count: {
                        select: {
                            jurnalDetail: true,
                            transaksiDetail: true,
                        },
                    },
                },
            });

            if (!account) {
                throw new ValidationError('Akun tidak ditemukan');
            }

            // Check permissions
            if (
                requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== account.perusahaanId
            ) {
                throw new AuthenticationError('Anda tidak memiliki akses ke akun ini');
            }

            return account;
        } catch (error) {
            logger.error('Get COA by ID error:', error);
            throw error;
        }
    }

    /**
     * List accounts with pagination and filters
     */
    async listAccounts(filters: ListCoaInput, requestingUserId: string) {
        try {
            const {
                page = 1,
                limit = 50,
                perusahaanId,
                search,
                tipe,
                kategoriAset,
                kategoriLiabilitas,
                kategoriEkuitas,
                parentId,
                level,
                isHeader,
                isActive,
                normalBalance,
            } = filters;

            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Build where clause
            const where: any = {};

            // Non-SUPERADMIN can only see their company's accounts
            if (requestingUser.role !== 'SUPERADMIN') {
                where.perusahaanId = requestingUser.perusahaanId;
            } else if (perusahaanId) {
                where.perusahaanId = perusahaanId;
            }

            if (tipe) {
                where.tipe = tipe;
            }

            if (kategoriAset) {
                where.kategoriAset = kategoriAset;
            }

            if (kategoriLiabilitas) {
                where.kategoriLiabilitas = kategoriLiabilitas;
            }

            if (kategoriEkuitas) {
                where.kategoriEkuitas = kategoriEkuitas;
            }

            if (parentId) {
                where.parentId = parentId;
            }

            if (level !== undefined) {
                where.level = level;
            }

            if (isHeader !== undefined) {
                where.isHeader = isHeader;
            }

            if (isActive !== undefined) {
                where.isActive = isActive;
            }

            if (normalBalance) {
                where.normalBalance = normalBalance;
            }

            if (search) {
                where.OR = [
                    { kodeAkun: { contains: search, mode: 'insensitive' } },
                    { namaAkun: { contains: search, mode: 'insensitive' } },
                ];
            }

            // Get total count
            const total = await prisma.chartOfAccounts.count({ where });

            // Get accounts
            const accounts = await prisma.chartOfAccounts.findMany({
                where,
                select: {
                    id: true,
                    kodeAkun: true,
                    namaAkun: true,
                    tipe: true,
                    kategoriAset: true,
                    kategoriLiabilitas: true,
                    kategoriEkuitas: true,
                    level: true,
                    normalBalance: true,
                    isHeader: true,
                    isActive: true,
                    allowManualEntry: true,
                    saldoBerjalan: true,
                    parent: {
                        select: {
                            id: true,
                            kodeAkun: true,
                            namaAkun: true,
                        },
                    },
                    _count: {
                        select: {
                            children: true,
                        },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { kodeAkun: 'asc' },
            });

            return {
                data: accounts,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('List COA error:', error);
            throw error;
        }
    }

    /**
     * Get account hierarchy
     */
    async getAccountHierarchy(filters: GetCoaHierarchyInput, requestingUserId: string) {
        try {
            const { perusahaanId, tipe, includeInactive = false } = filters;

            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Check permissions
            if (
                requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== perusahaanId
            ) {
                throw new AuthenticationError('Anda tidak memiliki akses ke perusahaan ini');
            }

            // Build where clause
            const where: any = { perusahaanId };

            if (tipe) {
                where.tipe = tipe;
            }

            if (!includeInactive) {
                where.isActive = true;
            }

            // Get all accounts
            const accounts = await prisma.chartOfAccounts.findMany({
                where,
                select: {
                    id: true,
                    kodeAkun: true,
                    namaAkun: true,
                    tipe: true,
                    level: true,
                    parentId: true,
                    normalBalance: true,
                    isHeader: true,
                    isActive: true,
                    saldoBerjalan: true,
                },
                orderBy: { kodeAkun: 'asc' },
            });

            // Build hierarchy
            const hierarchy = this.buildHierarchy(accounts);

            return hierarchy;
        } catch (error) {
            logger.error('Get COA hierarchy error:', error);
            throw error;
        }
    }

    /**
     * Update account
     */
    async updateAccount(
        accountId: string,
        data: UpdateCoaInput['body'],
        requestingUserId: string
    ): Promise<ChartOfAccounts> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const account = await prisma.chartOfAccounts.findUnique({
                where: { id: accountId },
                include: {
                    _count: {
                        select: {
                            jurnalDetail: true,
                            transaksiDetail: true,
                        },
                    },
                },
            });

            if (!account) {
                throw new ValidationError('Akun tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === account.perusahaanId;
            const isAdmin = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);

            if (!isSuperAdmin && !(isOwnCompany && isAdmin)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk mengupdate akun ini');
            }

            // Cannot update if has transactions (except for certain fields)
            if (account._count.jurnalDetail > 0 || account._count.transaksiDetail > 0) {
                // Only allow updating certain fields
                const allowedFields = ['namaAkun', 'catatan', 'isActive'];
                const attemptedFields = Object.keys(data);
                const disallowedFields = attemptedFields.filter((f) => !allowedFields.includes(f));

                if (disallowedFields.length > 0) {
                    throw new ValidationError(
                        `Akun tidak dapat diubah karena sudah memiliki transaksi. Hanya field berikut yang dapat diubah: ${allowedFields.join(', ')}`
                    );
                }
            }

            // Update account
            const updatedAccount = await prisma.chartOfAccounts.update({
                where: { id: accountId },
                data,
            });

            logger.info(`COA updated: ${updatedAccount.kodeAkun} by ${requestingUser.email}`);

            return updatedAccount;
        } catch (error) {
            logger.error('Update COA error:', error);
            throw error;
        }
    }

    /**
     * Update account balance
     */
    async updateAccountBalance(
        accountId: string,
        data: UpdateCoaBalanceInput['body'],
        requestingUserId: string
    ): Promise<ChartOfAccounts> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const account = await prisma.chartOfAccounts.findUnique({
                where: { id: accountId },
            });

            if (!account) {
                throw new ValidationError('Akun tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === account.perusahaanId;
            const isAdmin = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);

            if (!isSuperAdmin && !(isOwnCompany && isAdmin)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk mengupdate saldo akun ini');
            }

            // Update balance
            const updatedAccount = await prisma.chartOfAccounts.update({
                where: { id: accountId },
                data: {
                    saldoAwal: data.saldoAwal,
                    saldoAwalDebit: data.saldoAwalDebit,
                    saldoAwalKredit: data.saldoAwalKredit,
                    saldoBerjalan: data.saldoAwal ?? account.saldoAwal,
                },
            });

            logger.info(`COA balance updated: ${updatedAccount.kodeAkun} by ${requestingUser.email}`);

            return updatedAccount;
        } catch (error) {
            logger.error('Update COA balance error:', error);
            throw error;
        }
    }

    /**
     * Delete account
     */
    async deleteAccount(accountId: string, requestingUserId: string): Promise<void> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const account = await prisma.chartOfAccounts.findUnique({
                where: { id: accountId },
                include: {
                    children: true,
                    _count: {
                        select: {
                            jurnalDetail: true,
                            transaksiDetail: true,
                        },
                    },
                },
            });

            if (!account) {
                throw new ValidationError('Akun tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === account.perusahaanId;
            const isAdmin = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);

            if (!isSuperAdmin && !(isOwnCompany && isAdmin)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk menghapus akun ini');
            }

            // Cannot delete if has children
            if (account.children.length > 0) {
                throw new ValidationError(
                    'Akun tidak dapat dihapus karena memiliki sub-akun. Hapus sub-akun terlebih dahulu.'
                );
            }

            // Cannot delete if has transactions
            if (account._count.jurnalDetail > 0 || account._count.transaksiDetail > 0) {
                throw new ValidationError(
                    'Akun tidak dapat dihapus karena sudah memiliki transaksi. Nonaktifkan akun sebagai gantinya.'
                );
            }

            // Delete account
            await prisma.chartOfAccounts.delete({
                where: { id: accountId },
            });

            logger.info(`COA deleted: ${account.kodeAkun} by ${requestingUser.email}`);
        } catch (error) {
            logger.error('Delete COA error:', error);
            throw error;
        }
    }

    /**
     * Build hierarchy from flat list
     */
    private buildHierarchy(accounts: any[]): any[] {
        const map = new Map();
        const roots: any[] = [];

        // Create map of all accounts
        accounts.forEach((account) => {
            map.set(account.id, { ...account, children: [] });
        });

        // Build tree
        accounts.forEach((account) => {
            const node = map.get(account.id);
            if (account.parentId && map.has(account.parentId)) {
                const parent = map.get(account.parentId);
                parent.children.push(node);
            } else {
                roots.push(node);
            }
        });

        return roots;
    }
}

// Export singleton instance
export const coaService = new CoaService();

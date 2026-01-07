"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.coaService = exports.CoaService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const client_1 = require("@prisma/client");
const auth_service_1 = require("./auth.service");
/**
 * Chart of Accounts Service
 * Handles COA management with hierarchy support
 */
class CoaService {
    /**
     * Create new account
     */
    async createAccount(data, requestingUserId) {
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
            const isAdmin = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && isAdmin)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk membuat akun');
            }
            // Check if kodeAkun already exists for this company
            const existingKode = await database_1.default.chartOfAccounts.findFirst({
                where: {
                    perusahaanId: data.perusahaanId,
                    kodeAkun: data.kodeAkun,
                },
            });
            if (existingKode) {
                throw new auth_service_1.ValidationError('Kode akun sudah digunakan untuk perusahaan ini');
            }
            // Verify parent account if provided
            if (data.parentId) {
                const parentAccount = await database_1.default.chartOfAccounts.findUnique({
                    where: { id: data.parentId },
                });
                if (!parentAccount || parentAccount.perusahaanId !== data.perusahaanId) {
                    throw new auth_service_1.ValidationError('Parent account tidak valid');
                }
                // Parent must be same type
                if (parentAccount.tipe !== data.tipe) {
                    throw new auth_service_1.ValidationError('Parent account harus memiliki tipe yang sama');
                }
                // Parent must be header
                if (!parentAccount.isHeader) {
                    throw new auth_service_1.ValidationError('Parent account harus berupa header');
                }
                // Set level based on parent
                data.level = parentAccount.level + 1;
            }
            // Header accounts cannot have manual entries
            if (data.isHeader) {
                data.allowManualEntry = false;
            }
            // Validate kategori based on tipe
            if (data.tipe === client_1.TipeAkun.ASET && !data.kategoriAset) {
                throw new auth_service_1.ValidationError('Kategori aset wajib diisi untuk akun tipe ASET');
            }
            if (data.tipe === client_1.TipeAkun.LIABILITAS && !data.kategoriLiabilitas) {
                throw new auth_service_1.ValidationError('Kategori liabilitas wajib diisi untuk akun tipe LIABILITAS');
            }
            if (data.tipe === client_1.TipeAkun.EKUITAS && !data.kategoriEkuitas) {
                throw new auth_service_1.ValidationError('Kategori ekuitas wajib diisi untuk akun tipe EKUITAS');
            }
            // Create account
            const account = await database_1.default.chartOfAccounts.create({
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
            logger_1.default.info(`COA created: ${account.kodeAkun} - ${account.namaAkun} by ${requestingUser.email}`);
            return account;
        }
        catch (error) {
            logger_1.default.error('Create COA error:', error);
            throw error;
        }
    }
    /**
     * Get account by ID
     */
    async getAccountById(accountId, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const account = await database_1.default.chartOfAccounts.findUnique({
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
                throw new auth_service_1.ValidationError('Akun tidak ditemukan');
            }
            // Check permissions
            if (requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== account.perusahaanId) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses ke akun ini');
            }
            return account;
        }
        catch (error) {
            logger_1.default.error('Get COA by ID error:', error);
            throw error;
        }
    }
    /**
     * List accounts with pagination and filters
     */
    async listAccounts(filters, requestingUserId) {
        try {
            const { page = 1, limit = 50, perusahaanId, search, tipe, kategoriAset, kategoriLiabilitas, kategoriEkuitas, parentId, level, isHeader, isActive, normalBalance, } = filters;
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Build where clause
            const where = {};
            // Non-SUPERADMIN can only see their company's accounts
            if (requestingUser.role !== 'SUPERADMIN') {
                where.perusahaanId = requestingUser.perusahaanId;
            }
            else if (perusahaanId) {
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
            const total = await database_1.default.chartOfAccounts.count({ where });
            // Get accounts
            const accounts = await database_1.default.chartOfAccounts.findMany({
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
        }
        catch (error) {
            logger_1.default.error('List COA error:', error);
            throw error;
        }
    }
    /**
     * Get account hierarchy
     */
    async getAccountHierarchy(filters, requestingUserId) {
        try {
            const { perusahaanId, tipe, includeInactive = false } = filters;
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Check permissions
            if (requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== perusahaanId) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses ke perusahaan ini');
            }
            // Build where clause
            const where = { perusahaanId };
            if (tipe) {
                where.tipe = tipe;
            }
            if (!includeInactive) {
                where.isActive = true;
            }
            // Get all accounts
            const accounts = await database_1.default.chartOfAccounts.findMany({
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
        }
        catch (error) {
            logger_1.default.error('Get COA hierarchy error:', error);
            throw error;
        }
    }
    /**
     * Update account
     */
    async updateAccount(accountId, data, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const account = await database_1.default.chartOfAccounts.findUnique({
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
                throw new auth_service_1.ValidationError('Akun tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === account.perusahaanId;
            const isAdmin = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && isAdmin)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk mengupdate akun ini');
            }
            // Cannot update if has transactions (except for certain fields)
            if (account._count.jurnalDetail > 0 || account._count.transaksiDetail > 0) {
                // Only allow updating certain fields
                const allowedFields = ['namaAkun', 'catatan', 'isActive'];
                const attemptedFields = Object.keys(data);
                const disallowedFields = attemptedFields.filter((f) => !allowedFields.includes(f));
                if (disallowedFields.length > 0) {
                    throw new auth_service_1.ValidationError(`Akun tidak dapat diubah karena sudah memiliki transaksi. Hanya field berikut yang dapat diubah: ${allowedFields.join(', ')}`);
                }
            }
            // Update account
            const updatedAccount = await database_1.default.chartOfAccounts.update({
                where: { id: accountId },
                data,
            });
            logger_1.default.info(`COA updated: ${updatedAccount.kodeAkun} by ${requestingUser.email}`);
            return updatedAccount;
        }
        catch (error) {
            logger_1.default.error('Update COA error:', error);
            throw error;
        }
    }
    /**
     * Update account balance
     */
    async updateAccountBalance(accountId, data, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const account = await database_1.default.chartOfAccounts.findUnique({
                where: { id: accountId },
            });
            if (!account) {
                throw new auth_service_1.ValidationError('Akun tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === account.perusahaanId;
            const isAdmin = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && isAdmin)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk mengupdate saldo akun ini');
            }
            // Update balance
            const updatedAccount = await database_1.default.chartOfAccounts.update({
                where: { id: accountId },
                data: {
                    saldoAwal: data.saldoAwal,
                    saldoAwalDebit: data.saldoAwalDebit,
                    saldoAwalKredit: data.saldoAwalKredit,
                    saldoBerjalan: data.saldoAwal ?? account.saldoAwal,
                },
            });
            logger_1.default.info(`COA balance updated: ${updatedAccount.kodeAkun} by ${requestingUser.email}`);
            return updatedAccount;
        }
        catch (error) {
            logger_1.default.error('Update COA balance error:', error);
            throw error;
        }
    }
    /**
     * Delete account
     */
    async deleteAccount(accountId, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const account = await database_1.default.chartOfAccounts.findUnique({
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
                throw new auth_service_1.ValidationError('Akun tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === account.perusahaanId;
            const isAdmin = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && isAdmin)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk menghapus akun ini');
            }
            // Cannot delete if has children
            if (account.children.length > 0) {
                throw new auth_service_1.ValidationError('Akun tidak dapat dihapus karena memiliki sub-akun. Hapus sub-akun terlebih dahulu.');
            }
            // Cannot delete if has transactions
            if (account._count.jurnalDetail > 0 || account._count.transaksiDetail > 0) {
                throw new auth_service_1.ValidationError('Akun tidak dapat dihapus karena sudah memiliki transaksi. Nonaktifkan akun sebagai gantinya.');
            }
            // Delete account
            await database_1.default.chartOfAccounts.delete({
                where: { id: accountId },
            });
            logger_1.default.info(`COA deleted: ${account.kodeAkun} by ${requestingUser.email}`);
        }
        catch (error) {
            logger_1.default.error('Delete COA error:', error);
            throw error;
        }
    }
    /**
     * Build hierarchy from flat list
     */
    buildHierarchy(accounts) {
        const map = new Map();
        const roots = [];
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
            }
            else {
                roots.push(node);
            }
        });
        return roots;
    }
}
exports.CoaService = CoaService;
// Export singleton instance
exports.coaService = new CoaService();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.costCenterService = exports.CostCenterService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const auth_service_1 = require("./auth.service");
/**
 * Cost Center Service
 * Manages cost center CRUD and analysis
 */
class CostCenterService {
    /**
     * Create Cost Center
     */
    async createCostCenter(data, userId) {
        try {
            const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
            if (!user)
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            const perusahaanId = user.perusahaanId;
            // Check duplicate code
            const existing = await database_1.default.costCenter.findUnique({
                where: { perusahaanId_kode: { perusahaanId, kode: data.kode } },
            });
            if (existing)
                throw new auth_service_1.ValidationError('Kode cost center sudah digunakan');
            const costCenter = await database_1.default.costCenter.create({
                data: {
                    ...data,
                    perusahaanId,
                },
            });
            logger_1.default.info(`Cost center created: ${costCenter.id}`);
            return costCenter;
        }
        catch (error) {
            logger_1.default.error('Create cost center error:', error);
            throw error;
        }
    }
    /**
     * Update Cost Center
     */
    async updateCostCenter(id, data, userId) {
        try {
            const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
            if (!user)
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            const costCenter = await database_1.default.costCenter.findUnique({ where: { id } });
            if (!costCenter)
                throw new auth_service_1.ValidationError('Cost center tidak ditemukan');
            // Check duplicate code if changing
            if (data.kode && data.kode !== costCenter.kode) {
                const existing = await database_1.default.costCenter.findUnique({
                    where: { perusahaanId_kode: { perusahaanId: costCenter.perusahaanId, kode: data.kode } },
                });
                if (existing)
                    throw new auth_service_1.ValidationError('Kode cost center sudah digunakan');
            }
            const updated = await database_1.default.costCenter.update({
                where: { id },
                data,
            });
            logger_1.default.info(`Cost center updated: ${id}`);
            return updated;
        }
        catch (error) {
            logger_1.default.error('Update cost center error:', error);
            throw error;
        }
    }
    /**
     * Delete Cost Center (soft delete)
     */
    async deleteCostCenter(id, userId) {
        try {
            const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
            if (!user)
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            await database_1.default.costCenter.update({
                where: { id },
                data: { isAktif: false },
            });
            logger_1.default.info(`Cost center deleted: ${id}`);
            return { message: 'Cost center berhasil dihapus' };
        }
        catch (error) {
            logger_1.default.error('Delete cost center error:', error);
            throw error;
        }
    }
    /**
     * Get Cost Centers
     */
    async getCostCenters(filters, userId) {
        try {
            const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
            if (!user)
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            const perusahaanId = user.role === 'SUPERADMIN' ? filters.perusahaanId : user.perusahaanId;
            const where = {
                perusahaanId,
                ...(filters.isAktif !== undefined && { isAktif: filters.isAktif }),
                ...(filters.parentId !== undefined && { parentId: filters.parentId }),
                ...(filters.search && {
                    OR: [
                        { kode: { contains: filters.search, mode: 'insensitive' } },
                        { nama: { contains: filters.search, mode: 'insensitive' } },
                    ],
                }),
            };
            const costCenters = await database_1.default.costCenter.findMany({
                where,
                include: {
                    parent: true,
                    children: true,
                },
                orderBy: { kode: 'asc' },
            });
            return costCenters;
        }
        catch (error) {
            logger_1.default.error('Get cost centers error:', error);
            throw error;
        }
    }
    /**
     * Get Cost Center By ID
     */
    async getCostCenterById(id, userId) {
        try {
            const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
            if (!user)
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            const costCenter = await database_1.default.costCenter.findUnique({
                where: { id },
                include: {
                    parent: true,
                    children: true,
                },
            });
            if (!costCenter)
                throw new auth_service_1.ValidationError('Cost center tidak ditemukan');
            return costCenter;
        }
        catch (error) {
            logger_1.default.error('Get cost center by ID error:', error);
            throw error;
        }
    }
    /**
     * Get Cost Center Transactions
     */
    async getCostCenterTransactions(id, startDate, endDate) {
        try {
            const costCenter = await database_1.default.costCenter.findUnique({ where: { id } });
            if (!costCenter)
                throw new auth_service_1.ValidationError('Cost center tidak ditemukan');
            const where = {
                costCenterId: id,
                ...(startDate && endDate && {
                    tanggal: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                }),
            };
            const transactions = await database_1.default.transaksi.findMany({
                where,
                include: {
                    detail: true,
                },
                orderBy: { tanggal: 'desc' },
            });
            const total = transactions.reduce((sum, t) => sum + t.total.toNumber(), 0);
            return {
                costCenter,
                transactions,
                summary: {
                    totalTransactions: transactions.length,
                    totalAmount: total,
                },
            };
        }
        catch (error) {
            logger_1.default.error('Get cost center transactions error:', error);
            throw error;
        }
    }
}
exports.CostCenterService = CostCenterService;
exports.costCenterService = new CostCenterService();

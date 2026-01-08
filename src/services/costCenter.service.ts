import prisma from '@/config/database';
import logger from '@/utils/logger';
import { Prisma } from '@prisma/client';
import { AuthenticationError, ValidationError } from './auth.service';
import type { CreateCostCenterInput, UpdateCostCenterInput, GetCostCentersInput } from '@/validators/costCenter.validator';

/**
 * Cost Center Service
 * Manages cost center CRUD and analysis
 */
export class CostCenterService {
    /**
     * Create Cost Center
     */
    async createCostCenter(data: CreateCostCenterInput, userId: string) {
        try {
            const user = await prisma.pengguna.findUnique({ where: { id: userId } });
            if (!user) throw new AuthenticationError('User tidak ditemukan');

            const perusahaanId = user.perusahaanId!;

            // Check duplicate code
            const existing = await prisma.costCenter.findUnique({
                where: { perusahaanId_kode: { perusahaanId, kode: data.kode } },
            });
            if (existing) throw new ValidationError('Kode cost center sudah digunakan');

            const costCenter = await prisma.costCenter.create({
                data: {
                    ...data,
                    perusahaanId,
                },
            });

            logger.info(`Cost center created: ${costCenter.id}`);
            return costCenter;
        } catch (error) {
            logger.error('Create cost center error:', error);
            throw error;
        }
    }

    /**
     * Update Cost Center
     */
    async updateCostCenter(id: string, data: UpdateCostCenterInput, userId: string) {
        try {
            const user = await prisma.pengguna.findUnique({ where: { id: userId } });
            if (!user) throw new AuthenticationError('User tidak ditemukan');

            const costCenter = await prisma.costCenter.findUnique({ where: { id } });
            if (!costCenter) throw new ValidationError('Cost center tidak ditemukan');

            // Check duplicate code if changing
            if (data.kode && data.kode !== costCenter.kode) {
                const existing = await prisma.costCenter.findUnique({
                    where: { perusahaanId_kode: { perusahaanId: costCenter.perusahaanId, kode: data.kode } },
                });
                if (existing) throw new ValidationError('Kode cost center sudah digunakan');
            }

            const updated = await prisma.costCenter.update({
                where: { id },
                data,
            });

            logger.info(`Cost center updated: ${id}`);
            return updated;
        } catch (error) {
            logger.error('Update cost center error:', error);
            throw error;
        }
    }

    /**
     * Delete Cost Center (soft delete)
     */
    async deleteCostCenter(id: string, userId: string) {
        try {
            const user = await prisma.pengguna.findUnique({ where: { id: userId } });
            if (!user) throw new AuthenticationError('User tidak ditemukan');

            await prisma.costCenter.update({
                where: { id },
                data: { isAktif: false },
            });

            logger.info(`Cost center deleted: ${id}`);
            return { message: 'Cost center berhasil dihapus' };
        } catch (error) {
            logger.error('Delete cost center error:', error);
            throw error;
        }
    }

    /**
     * Get Cost Centers
     */
    async getCostCenters(filters: GetCostCentersInput, userId: string) {
        try {
            const user = await prisma.pengguna.findUnique({ where: { id: userId } });
            if (!user) throw new AuthenticationError('User tidak ditemukan');

            const perusahaanId = user.role === 'SUPERADMIN' ? filters.perusahaanId : user.perusahaanId;

            const where: Prisma.CostCenterWhereInput = {
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

            const costCenters = await prisma.costCenter.findMany({
                where,
                include: {
                    parent: true,
                    children: true,
                },
                orderBy: { kode: 'asc' },
            });

            return costCenters;
        } catch (error) {
            logger.error('Get cost centers error:', error);
            throw error;
        }
    }

    /**
     * Get Cost Center By ID
     */
    async getCostCenterById(id: string, userId: string) {
        try {
            const user = await prisma.pengguna.findUnique({ where: { id: userId } });
            if (!user) throw new AuthenticationError('User tidak ditemukan');

            const costCenter = await prisma.costCenter.findUnique({
                where: { id },
                include: {
                    parent: true,
                    children: true,
                },
            });

            if (!costCenter) throw new ValidationError('Cost center tidak ditemukan');
            return costCenter;
        } catch (error) {
            logger.error('Get cost center by ID error:', error);
            throw error;
        }
    }

    /**
     * Get Cost Center Transactions
     */
    async getCostCenterTransactions(id: string, startDate?: string, endDate?: string) {
        try {
            const costCenter = await prisma.costCenter.findUnique({ where: { id } });
            if (!costCenter) throw new ValidationError('Cost center tidak ditemukan');

            const where: Prisma.TransaksiWhereInput = {
                costCenterId: id,
                ...(startDate && endDate && {
                    tanggal: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                }),
            };

            const transactions = await prisma.transaksi.findMany({
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
        } catch (error) {
            logger.error('Get cost center transactions error:', error);
            throw error;
        }
    }
}

export const costCenterService = new CostCenterService();

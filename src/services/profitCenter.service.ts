import prisma from '@/config/database';
import logger from '@/utils/logger';
import { Prisma } from '@prisma/client';
import { AuthenticationError, ValidationError } from './auth.service';
import type { CreateProfitCenterInput, UpdateProfitCenterInput, GetProfitCentersInput } from '@/validators/profitCenter.validator';

export class ProfitCenterService {
    async createProfitCenter(data: CreateProfitCenterInput, userId: string) {
        const user = await prisma.pengguna.findUnique({ where: { id: userId } });
        if (!user) throw new AuthenticationError('User tidak ditemukan');

        const existing = await prisma.profitCenter.findUnique({
            where: { perusahaanId_kode: { perusahaanId: user.perusahaanId!, kode: data.kode } },
        });
        if (existing) throw new ValidationError('Kode profit center sudah digunakan');

        return await prisma.profitCenter.create({
            data: { ...data, perusahaanId: user.perusahaanId! },
        });
    }

    async updateProfitCenter(id: string, data: UpdateProfitCenterInput, userId: string) {
        const user = await prisma.pengguna.findUnique({ where: { id: userId } });
        if (!user) throw new AuthenticationError('User tidak ditemukan');

        return await prisma.profitCenter.update({ where: { id }, data });
    }

    async deleteProfitCenter(id: string, userId: string) {
        const user = await prisma.pengguna.findUnique({ where: { id: userId } });
        if (!user) throw new AuthenticationError('User tidak ditemukan');

        await prisma.profitCenter.update({ where: { id }, data: { isAktif: false } });
        return { message: 'Profit center berhasil dihapus' };
    }

    async getProfitCenters(filters: GetProfitCentersInput, userId: string) {
        const user = await prisma.pengguna.findUnique({ where: { id: userId } });
        if (!user) throw new AuthenticationError('User tidak ditemukan');

        const where: Prisma.ProfitCenterWhereInput = {
            perusahaanId: user.role === 'SUPERADMIN' ? filters.perusahaanId : user.perusahaanId,
            ...(filters.isAktif !== undefined && { isAktif: filters.isAktif }),
            ...(filters.search && {
                OR: [
                    { kode: { contains: filters.search, mode: 'insensitive' } },
                    { nama: { contains: filters.search, mode: 'insensitive' } },
                ],
            }),
        };

        return await prisma.profitCenter.findMany({
            where,
            include: { parent: true, children: true },
            orderBy: { kode: 'asc' },
        });
    }

    async getProfitCenterById(id: string, userId: string) {
        const user = await prisma.pengguna.findUnique({ where: { id: userId } });
        if (!user) throw new AuthenticationError('User tidak ditemukan');

        const profitCenter = await prisma.profitCenter.findUnique({
            where: { id },
            include: { parent: true, children: true },
        });

        if (!profitCenter) throw new ValidationError('Profit center tidak ditemukan');
        return profitCenter;
    }

    async getProfitCenterPerformance(id: string, startDate?: string, endDate?: string) {
        const profitCenter = await prisma.profitCenter.findUnique({ where: { id } });
        if (!profitCenter) throw new ValidationError('Profit center tidak ditemukan');

        const where: Prisma.TransaksiWhereInput = {
            profitCenterId: id,
            ...(startDate && endDate && {
                tanggal: { gte: new Date(startDate), lte: new Date(endDate) },
            }),
        };

        const transactions = await prisma.transaksi.findMany({
            where,
            include: { detail: true },
            orderBy: { tanggal: 'desc' },
        });

        const totalRevenue = transactions
            .filter((t) => t.tipe === 'PENJUALAN')
            .reduce((sum, t) => sum + t.total.toNumber(), 0);

        return {
            profitCenter,
            transactions,
            summary: {
                totalTransactions: transactions.length,
                totalRevenue,
            },
        };
    }
}

export const profitCenterService = new ProfitCenterService();

import prisma from '@/config/database';
import logger from '@/utils/logger';
import { Prisma } from '@prisma/client';
import { AuthenticationError, ValidationError } from './auth.service';
import type {
    CreateBudgetInput,
    UpdateBudgetInput,
    AddBudgetDetailInput,
    UpdateBudgetDetailInput,
    CreateBudgetRevisionInput,
    GetBudgetsInput,
} from '@/validators/budget.validator';

export class BudgetService {
    async createBudget(data: CreateBudgetInput, userId: string) {
        const user = await prisma.pengguna.findUnique({ where: { id: userId } });
        if (!user) throw new AuthenticationError('User tidak ditemukan');

        const existing = await prisma.budget.findUnique({
            where: { perusahaanId_kode: { perusahaanId: user.perusahaanId!, kode: data.kode } },
        });
        if (existing) throw new ValidationError('Kode budget sudah digunakan');

        const totalBudget = data.details.reduce((sum, d) => sum + d.jumlahBudget, 0);

        return await prisma.budget.create({
            data: {
                kode: data.kode,
                nama: data.nama,
                tahun: data.tahun,
                tipe: data.tipe,
                tanggalMulai: new Date(data.tanggalMulai),
                tanggalAkhir: new Date(data.tanggalAkhir),
                totalBudget,
                departemen: data.departemen,
                projectCode: data.projectCode,
                deskripsi: data.deskripsi,
                perusahaanId: user.perusahaanId!,
                detail: {
                    create: data.details.map((d) => ({
                        akunId: d.akunId,
                        bulan: d.bulan,
                        periode: new Date(d.periode),
                        jumlahBudget: d.jumlahBudget,
                        keterangan: d.keterangan,
                    })),
                },
            },
            include: { detail: { include: { akun: true } } },
        });
    }

    async updateBudget(id: string, data: UpdateBudgetInput, userId: string) {
        const budget = await prisma.budget.findUnique({ where: { id } });
        if (!budget) throw new ValidationError('Budget tidak ditemukan');
        if (budget.status !== 'DRAFT') throw new ValidationError('Hanya budget DRAFT yang bisa diubah');

        return await prisma.budget.update({ where: { id }, data });
    }

    async deleteBudget(id: string, userId: string) {
        const budget = await prisma.budget.findUnique({ where: { id } });
        if (!budget) throw new ValidationError('Budget tidak ditemukan');
        if (budget.status !== 'DRAFT') throw new ValidationError('Hanya budget DRAFT yang bisa dihapus');

        await prisma.budget.delete({ where: { id } });
        return { message: 'Budget berhasil dihapus' };
    }

    async approveBudget(id: string, userId: string) {
        const budget = await prisma.budget.findUnique({ where: { id } });
        if (!budget) throw new ValidationError('Budget tidak ditemukan');
        if (budget.status !== 'DRAFT') throw new ValidationError('Budget sudah disetujui');

        return await prisma.budget.update({
            where: { id },
            data: {
                status: 'APPROVED',
                disetujuiOleh: userId,
                tanggalDisetujui: new Date(),
            },
        });
    }

    async activateBudget(id: string, userId: string) {
        const budget = await prisma.budget.findUnique({ where: { id } });
        if (!budget) throw new ValidationError('Budget tidak ditemukan');
        if (budget.status !== 'APPROVED') throw new ValidationError('Budget harus disetujui dulu');

        return await prisma.budget.update({ where: { id }, data: { status: 'AKTIF' } });
    }

    async closeBudget(id: string, userId: string) {
        return await prisma.budget.update({ where: { id }, data: { status: 'CLOSED' } });
    }

    async getBudgets(filters: GetBudgetsInput, userId: string) {
        const user = await prisma.pengguna.findUnique({ where: { id: userId } });
        if (!user) throw new AuthenticationError('User tidak ditemukan');

        const where: Prisma.BudgetWhereInput = {
            perusahaanId: user.role === 'SUPERADMIN' ? filters.perusahaanId : user.perusahaanId,
            ...(filters.tahun && { tahun: filters.tahun }),
            ...(filters.status && { status: filters.status }),
            ...(filters.tipe && { tipe: filters.tipe }),
        };

        return await prisma.budget.findMany({
            where,
            include: { detail: { include: { akun: true } } },
            orderBy: { tahun: 'desc' },
        });
    }

    async getBudgetById(id: string, userId: string) {
        const budget = await prisma.budget.findUnique({
            where: { id },
            include: {
                detail: { include: { akun: true } },
                revisi: true,
            },
        });
        if (!budget) throw new ValidationError('Budget tidak ditemukan');
        return budget;
    }

    async addBudgetDetail(budgetId: string, data: AddBudgetDetailInput, userId: string) {
        const budget = await prisma.budget.findUnique({ where: { id: budgetId } });
        if (!budget) throw new ValidationError('Budget tidak ditemukan');
        if (budget.status !== 'DRAFT') throw new ValidationError('Hanya budget DRAFT yang bisa ditambah detail');

        const detail = await prisma.budgetDetail.create({
            data: {
                budgetId,
                akunId: data.akunId,
                bulan: data.bulan,
                periode: new Date(data.periode),
                jumlahBudget: data.jumlahBudget,
                keterangan: data.keterangan,
            },
        });

        // Update total budget
        await this.recalculateBudgetTotal(budgetId);
        return detail;
    }

    async updateBudgetDetail(budgetId: string, detailId: string, data: UpdateBudgetDetailInput, userId: string) {
        const budget = await prisma.budget.findUnique({ where: { id: budgetId } });
        if (!budget) throw new ValidationError('Budget tidak ditemukan');
        if (budget.status !== 'DRAFT') throw new ValidationError('Hanya budget DRAFT yang bisa diubah');

        const detail = await prisma.budgetDetail.update({
            where: { id: detailId },
            data,
        });

        await this.recalculateBudgetTotal(budgetId);
        return detail;
    }

    async deleteBudgetDetail(budgetId: string, detailId: string, userId: string) {
        const budget = await prisma.budget.findUnique({ where: { id: budgetId } });
        if (!budget) throw new ValidationError('Budget tidak ditemukan');
        if (budget.status !== 'DRAFT') throw new ValidationError('Hanya budget DRAFT yang bisa dihapus detail');

        await prisma.budgetDetail.delete({ where: { id: detailId } });
        await this.recalculateBudgetTotal(budgetId);
        return { message: 'Budget detail berhasil dihapus' };
    }

    async createBudgetRevision(budgetId: string, data: CreateBudgetRevisionInput, userId: string) {
        const budget = await prisma.budget.findUnique({ where: { id: budgetId }, include: { revisi: true } });
        if (!budget) throw new ValidationError('Budget tidak ditemukan');

        const versi = (budget.revisi.length || 0) + 1;

        return await prisma.budgetRevisi.create({
            data: {
                budgetId,
                versi,
                tanggalRevisi: new Date(),
                alasanRevisi: data.alasanRevisi,
                jumlahSebelum: data.jumlahSebelum,
                jumlahSesudah: data.jumlahSesudah,
                direvisiOleh: userId,
                catatan: data.catatan,
            },
        });
    }

    async getBudgetVsActual(budgetId: string, bulan?: number) {
        const budget = await prisma.budget.findUnique({
            where: { id: budgetId },
            include: { detail: { include: { akun: true } } },
        });
        if (!budget) throw new ValidationError('Budget tidak ditemukan');

        const details = bulan ? budget.detail.filter((d) => d.bulan === bulan) : budget.detail;

        const result = await Promise.all(
            details.map(async (d) => {
                // Get actual from jurnal
                const actual = await prisma.jurnalDetail.aggregate({
                    where: {
                        akunId: d.akunId,
                        jurnal: {
                            tanggal: {
                                gte: new Date(budget.tahun, d.bulan - 1, 1),
                                lte: new Date(budget.tahun, d.bulan, 0),
                            },
                        },
                    },
                    _sum: {
                        debit: true,
                        kredit: true,
                    },
                });

                const actualAmount = (actual._sum.debit?.toNumber() || 0) - (actual._sum.kredit?.toNumber() || 0);
                const variance = d.jumlahBudget.toNumber() - actualAmount;
                const variancePercentage = d.jumlahBudget.toNumber() ? (variance / d.jumlahBudget.toNumber()) * 100 : 0;

                return {
                    akunId: d.akunId,
                    namaAkun: d.akun.namaAkun,
                    bulan: d.bulan,
                    budget: d.jumlahBudget.toNumber(),
                    actual: actualAmount,
                    variance,
                    variancePercentage,
                };
            })
        );

        return {
            budget,
            analysis: result,
            summary: {
                totalBudget: result.reduce((sum, r) => sum + r.budget, 0),
                totalActual: result.reduce((sum, r) => sum + r.actual, 0),
                totalVariance: result.reduce((sum, r) => sum + r.variance, 0),
            },
        };
    }

    private async recalculateBudgetTotal(budgetId: string) {
        const details = await prisma.budgetDetail.findMany({ where: { budgetId } });
        const total = details.reduce((sum, d) => sum + d.jumlahBudget.toNumber(), 0);
        await prisma.budget.update({ where: { id: budgetId }, data: { totalBudget: total } });
    }
}

export const budgetService = new BudgetService();

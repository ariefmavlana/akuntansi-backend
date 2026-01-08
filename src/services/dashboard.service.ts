import prisma from '@/config/database';
import { TipeWidget, TipeAkun } from '@prisma/client';

export class DashboardService {
    /**
     * Get Key Financial Stats (Revenue, Expense, Profit)
     */
    async getStats(perusahaanId: string, startDate: Date, endDate: Date) {
        // 1. Calculate Revenue (Pendapatan - Type 4)
        const revenueAgg = await prisma.jurnalDetail.aggregate({
            _sum: { kredit: true, debit: true },
            where: {
                jurnal: {
                    perusahaanId,
                    tanggal: { gte: startDate, lte: endDate }
                },
                akun: {
                    tipe: {
                        in: [TipeAkun.PENDAPATAN, TipeAkun.PENDAPATAN_KOMPREHENSIF_LAIN]
                    }
                }
            }
        });

        const revCredit = revenueAgg._sum.kredit ? revenueAgg._sum.kredit.toNumber() : 0;
        const revDebit = revenueAgg._sum.debit ? revenueAgg._sum.debit.toNumber() : 0;
        const totalRevenue = revCredit - revDebit;

        // 2. Calculate Expenses (Beban - Type 5)
        const expenseAgg = await prisma.jurnalDetail.aggregate({
            _sum: { debit: true, kredit: true },
            where: {
                jurnal: {
                    perusahaanId,
                    tanggal: { gte: startDate, lte: endDate }
                },
                akun: {
                    tipe: {
                        in: [TipeAkun.BEBAN]
                    }
                }
            }
        });

        const expDebit = expenseAgg._sum.debit ? expenseAgg._sum.debit.toNumber() : 0;
        const expCredit = expenseAgg._sum.kredit ? expenseAgg._sum.kredit.toNumber() : 0;
        const totalExpense = expDebit - expCredit;

        // 3. Net Profit
        const netProfit = totalRevenue - totalExpense;

        return {
            revenue: totalRevenue,
            expense: totalExpense,
            netProfit
        };
    }

    /**
     * Get Widget Config for User
     */
    async getUserWidgets(userId: string, perusahaanId: string) {
        return await prisma.dashboardWidget.findMany({
            where: { perusahaanId, penggunaId: userId, isAktif: true },
            orderBy: { posisi: 'asc' }
        });
    }

    /**
     * Create/Add Widget
     */
    async createWidget(userId: string, perusahaanId: string, data: {
        nama: string;
        tipe: TipeWidget;
        kategori?: string;
        konfigurasi: any;
        posisi: number;
        lebar?: number;
        tinggi?: number;
    }) {
        return await prisma.dashboardWidget.create({
            data: {
                perusahaanId,
                penggunaId: userId,
                ...data
            }
        });
    }

    /**
     * Delete Widget
     */
    async deleteWidget(id: string, userId: string) {
        return await prisma.dashboardWidget.deleteMany({
            where: { id, penggunaId: userId } // Ensure ownership
        });
    }
}

export const dashboardService = new DashboardService();

import prisma from '@/config/database';
import logger from '@/utils/logger';
import type {
    GetFinancialKPIsInput,
    GetCashFlowSummaryInput,
    GetRevenueAnalyticsInput,
    GetExpenseAnalyticsInput,
    GetProfitabilityInput,
    GetBalanceTrendInput,
    GetTopAccountsInput,
} from '@/validators/dashboard.validator';
import { Prisma } from '@prisma/client';

export class DashboardService {
    // Get Financial KPIs
    async getFinancialKPIs(filters: GetFinancialKPIsInput) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);

        // Get total revenue
        const revenue = await prisma.jurnalDetail.aggregate({
            where: {
                jurnal: {
                    perusahaanId: filters.perusahaanId,
                    tanggal: { gte: startDate, lte: endDate },
                },
                akun: { tipe: 'PENDAPATAN' },
            },
            _sum: { kredit: true },
        });

        // Get total expenses
        const expenses = await prisma.jurnalDetail.aggregate({
            where: {
                jurnal: {
                    perusahaanId: filters.perusahaanId,
                    tanggal: { gte: startDate, lte: endDate },
                },
                akun: { tipe: 'BEBAN' },
            },
            _sum: { debit: true },
        });

        // Get total assets
        const assets = await prisma.chartOfAccounts.aggregate({
            where: {
                perusahaanId: filters.perusahaanId,
                tipe: 'ASET',
            },
            _sum: { saldoBerjalan: true },
        });

        // Get total liabilities
        const liabilities = await prisma.chartOfAccounts.aggregate({
            where: {
                perusahaanId: filters.perusahaanId,
                tipe: 'LIABILITAS',
            },
            _sum: { saldoBerjalan: true },
        });

        //Note: saldoPiutang/saldoHutang calculated from open transactions
        // For now, we'll skip these or calculate from Transaksi table
        const receivables = { _sum: { total: 0 } };
        const payables = { _sum: { total: 0 } };

        const totalRevenue = revenue._sum.kredit || 0;
        const totalExpenses = expenses._sum.debit || 0;
        const netProfit = Number(totalRevenue) - Number(totalExpenses);
        const profitMargin = Number(totalRevenue) > 0 ? (netProfit / Number(totalRevenue)) * 100 : 0;

        return {
            revenue: {
                total: totalRevenue,
                currency: 'IDR',
            },
            expenses: {
                total: totalExpenses,
                currency: 'IDR',
            },
            netProfit: {
                total: netProfit,
                margin: profitMargin,
                currency: 'IDR',
            },
            assets: {
                total: assets._sum.saldoBerjalan || 0,
                currency: 'IDR',
            },
            liabilities: {
                total: liabilities._sum.saldoBerjalan || 0,
                currency: 'IDR',
            },
            equity: {
                total: Number(assets._sum.saldoBerjalan || 0) - Number(liabilities._sum.saldoBerjalan || 0),
                currency: 'IDR',
            },
            receivables: {
                total: receivables._sum.total || 0,
                currency: 'IDR',
            },
            payables: {
                total: payables._sum.total || 0,
                currency: 'IDR',
            },
            period: {
                startDate: filters.startDate,
                endDate: filters.endDate,
            },
        };
    }

    // Get Cash Flow Summary
    async getCashFlowSummary(filters: GetCashFlowSummaryInput) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);

        // Cash inflows (credits to cash accounts)
        const inflows = await prisma.jurnalDetail.aggregate({
            where: {
                jurnal: {
                    perusahaanId: filters.perusahaanId,
                    tanggal: { gte: startDate, lte: endDate },
                },
                akun: {
                    kategoriAset: 'KAS_DAN_SETARA_KAS',
                },
                kredit: { gt: 0 },
            },
            _sum: { kredit: true },
        });

        // Cash outflows (debits from cash accounts)
        const outflows = await prisma.jurnalDetail.aggregate({
            where: {
                jurnal: {
                    perusahaanId: filters.perusahaanId,
                    tanggal: { gte: startDate, lte: endDate },
                },
                akun: {
                    kategoriAset: 'KAS_DAN_SETARA_KAS',
                },
                debit: { gt: 0 },
            },
            _sum: { debit: true },
        });

        const totalInflows = inflows._sum.kredit || 0;
        const totalOutflows = outflows._sum.debit || 0;
        const netCashFlow = Number(totalInflows) - Number(totalOutflows);

        return {
            inflows: totalInflows,
            outflows: totalOutflows,
            netCashFlow,
            currency: 'IDR',
            period: {
                startDate: filters.startDate,
                endDate: filters.endDate,
            },
        };
    }

    // Get Revenue Analytics
    async getRevenueAnalytics(filters: GetRevenueAnalyticsInput) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);

        // Get revenue transactions
        const revenue = await prisma.$queryRaw<any[]>`
            SELECT 
                DATE_TRUNC(${filters.groupBy || 'month'}, j."tanggal") as period,
                SUM(jd."kredit") as total
            FROM "JurnalDetail" jd
            JOIN "JurnalUmum" j ON jd."jurnalId" = j."id"
            JOIN "ChartOfAccounts" c ON jd."akunId" = c."id"
            WHERE j."perusahaanId" = ${filters.perusahaanId}
                AND j."tanggal" >= ${startDate}
                AND j."tanggal" <= ${endDate}
                AND c."tipe" = 'PENDAPATAN'
            GROUP BY period
            ORDER BY period ASC
        `;

        return {
            data: revenue.map((r) => ({
                period: r.period,
                total: Number(r.total),
            })),
            currency: 'IDR',
        };
    }

    // Get Expense Analytics
    async getExpenseAnalytics(filters: GetExpenseAnalyticsInput) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);

        const expenses = await prisma.$queryRaw<any[]>`
            SELECT 
                DATE_TRUNC(${filters.groupBy || 'month'}, j."tanggal") as period,
                SUM(jd."debit") as total
            FROM "JurnalDetail" jd
            JOIN "JurnalUmum" j ON jd."jurnalId" = j."id"
            JOIN "ChartOfAccounts" c ON jd."akunId" = c."id"
            WHERE j."perusahaanId" = ${filters.perusahaanId}
                AND j."tanggal" >= ${startDate}
                AND j."tanggal" <= ${endDate}
                AND c."tipe" = 'BEBAN'
            GROUP BY period
            ORDER BY period ASC
        `;

        return {
            data: expenses.map((e) => ({
                period: e.period,
                total: Number(e.total),
            })),
            currency: 'IDR',
        };
    }

    // Get Profitability Metrics
    async getProfitability(filters: GetProfitabilityInput) {
        const kpis = await this.getFinancialKPIs(filters);

        const grossProfit = Number(kpis.revenue.total) - Number(kpis.expenses.total);
        const grossMargin = Number(kpis.revenue.total) > 0 ? (grossProfit / Number(kpis.revenue.total)) * 100 : 0;

        // ROA = Net Income / Total Assets
        const roa = Number(kpis.assets.total) > 0 ? (kpis.netProfit.total / Number(kpis.assets.total)) * 100 : 0;

        // ROE = Net Income / Equity
        const roe = Number(kpis.equity.total) > 0 ? (kpis.netProfit.total / Number(kpis.equity.total)) * 100 : 0;

        return {
            grossProfit: {
                total: grossProfit,
                margin: grossMargin,
            },
            netProfit: kpis.netProfit,
            returnOnAssets: roa,
            returnOnEquity: roe,
            currency: 'IDR',
            period: {
                startDate: filters.startDate,
                endDate: filters.endDate,
            },
        };
    }

    // Get Account Balance Trend
    async getBalanceTrend(filters: GetBalanceTrendInput) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);

        const trend = await prisma.$queryRaw<any[]>`
            SELECT 
                DATE_TRUNC(${filters.groupBy || 'month'}, j."tanggal") as period,
                SUM(jd."debit") as total_debit,
                SUM(jd."kredit") as total_kredit
            FROM "JurnalDetail" jd
            JOIN "JurnalUmum" j ON jd."jurnalId" = j."id"
            WHERE jd."akunId" = ${filters.akunId}
                AND j."perusahaanId" = ${filters.perusahaanId}
                AND j."tanggal" >= ${startDate}
                AND j."tanggal" <= ${endDate}
            GROUP BY period
            ORDER BY period ASC
        `;

        let runningBalance = 0;
        const data = trend.map((t) => {
            const debit = Number(t.total_debit) || 0;
            const kredit = Number(t.total_kredit) || 0;
            runningBalance += debit - kredit;

            return {
                period: t.period,
                debit,
                kredit,
                balance: runningBalance,
            };
        });

        return {
            data,
            currency: 'IDR',
        };
    }

    // Get Top Accounts by Activity
    async getTopAccounts(filters: GetTopAccountsInput) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);

        const whereClause: any = {
            jurnal: {
                perusahaanId: filters.perusahaanId,
                tanggal: { gte: startDate, lte: endDate },
            },
        };

        if (filters.tipeAkun) {
            whereClause.akun = { tipe: filters.tipeAkun };
        }

        const topAccounts = await prisma.jurnalDetail.groupBy({
            by: ['akunId'],
            where: whereClause,
            _sum: {
                debit: true,
                kredit: true,
            },
            _count: {
                id: true,
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
            take: filters.limit || 10,
        });

        // Get account details
        const accountIds = topAccounts.map((a) => a.akunId);
        const accounts = await prisma.chartOfAccounts.findMany({
            where: { id: { in: accountIds } },
            select: {
                id: true,
                kodeAkun: true,
                namaAkun: true,
                tipe: true,
            },
        });

        const accountMap = new Map(accounts.map((a) => [a.id, a]));

        return {
            data: topAccounts.map((ta) => {
                const account = accountMap.get(ta.akunId);
                return {
                    account: {
                        id: ta.akunId,
                        kodeAkun: account?.kodeAkun || '',
                        namaAkun: account?.namaAkun || '',
                        tipe: account?.tipe || '',
                    },
                    totalDebit: ta._sum.debit || 0,
                    totalKredit: ta._sum.kredit || 0,
                    transactionCount: ta._count.id,
                };
            }),
            currency: 'IDR',
        };
    }
}

export const dashboardService = new DashboardService();

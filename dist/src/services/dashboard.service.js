"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = exports.DashboardService = void 0;
const database_1 = __importDefault(require("../config/database"));
const client_1 = require("@prisma/client");
class DashboardService {
    /**
     * Get Key Financial Stats (Revenue, Expense, Profit)
     */
    async getStats(perusahaanId, startDate, endDate) {
        // 1. Calculate Revenue (Pendapatan - Type 4)
        const revenueAgg = await database_1.default.jurnalDetail.aggregate({
            _sum: { kredit: true, debit: true },
            where: {
                jurnal: {
                    perusahaanId,
                    tanggal: { gte: startDate, lte: endDate }
                },
                akun: {
                    tipe: {
                        in: [client_1.TipeAkun.PENDAPATAN, client_1.TipeAkun.PENDAPATAN_KOMPREHENSIF_LAIN]
                    }
                }
            }
        });
        const revCredit = revenueAgg._sum.kredit ? revenueAgg._sum.kredit.toNumber() : 0;
        const revDebit = revenueAgg._sum.debit ? revenueAgg._sum.debit.toNumber() : 0;
        const totalRevenue = revCredit - revDebit;
        // 2. Calculate Expenses (Beban - Type 5)
        const expenseAgg = await database_1.default.jurnalDetail.aggregate({
            _sum: { debit: true, kredit: true },
            where: {
                jurnal: {
                    perusahaanId,
                    tanggal: { gte: startDate, lte: endDate }
                },
                akun: {
                    tipe: {
                        in: [client_1.TipeAkun.BEBAN]
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
    async getUserWidgets(userId, perusahaanId) {
        return await database_1.default.dashboardWidget.findMany({
            where: { perusahaanId, penggunaId: userId, isAktif: true },
            orderBy: { posisi: 'asc' }
        });
    }
    /**
     * Create/Add Widget
     */
    async createWidget(userId, perusahaanId, data) {
        return await database_1.default.dashboardWidget.create({
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
    async deleteWidget(id, userId) {
        return await database_1.default.dashboardWidget.deleteMany({
            where: { id, penggunaId: userId } // Ensure ownership
        });
    }
}
exports.DashboardService = DashboardService;
exports.dashboardService = new DashboardService();

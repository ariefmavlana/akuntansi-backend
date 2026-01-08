"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = exports.DashboardController = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
class DashboardController {
    // Get Financial KPIs
    async getKPIs(req, res, next) {
        try {
            const filters = req.query;
            const kpis = await dashboard_service_1.dashboardService.getFinancialKPIs(filters);
            return res.json({
                success: true,
                data: kpis,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Get Cash Flow Summary
    async getCashFlow(req, res, next) {
        try {
            const filters = req.query;
            const cashFlow = await dashboard_service_1.dashboardService.getCashFlowSummary(filters);
            return res.json({
                success: true,
                data: cashFlow,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Get Revenue Analytics
    async getRevenue(req, res, next) {
        try {
            const filters = req.query;
            const revenue = await dashboard_service_1.dashboardService.getRevenueAnalytics(filters);
            return res.json({
                success: true,
                data: revenue.data,
                meta: {
                    currency: revenue.currency,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Get Expense Analytics
    async getExpenses(req, res, next) {
        try {
            const filters = req.query;
            const expenses = await dashboard_service_1.dashboardService.getExpenseAnalytics(filters);
            return res.json({
                success: true,
                data: expenses.data,
                meta: {
                    currency: expenses.currency,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Get Profitability Metrics
    async getProfitability(req, res, next) {
        try {
            const filters = req.query;
            const profitability = await dashboard_service_1.dashboardService.getProfitability(filters);
            return res.json({
                success: true,
                data: profitability,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Get Account Balance Trend
    async getBalanceTrend(req, res, next) {
        try {
            const filters = req.query;
            const trend = await dashboard_service_1.dashboardService.getBalanceTrend(filters);
            return res.json({
                success: true,
                data: trend.data,
                meta: {
                    currency: trend.currency,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Get Top Accounts by Activity
    async getTopAccounts(req, res, next) {
        try {
            const filters = req.query;
            const topAccounts = await dashboard_service_1.dashboardService.getTopAccounts(filters);
            return res.json({
                success: true,
                data: topAccounts.data,
                meta: {
                    currency: topAccounts.currency,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DashboardController = DashboardController;
exports.dashboardController = new DashboardController();

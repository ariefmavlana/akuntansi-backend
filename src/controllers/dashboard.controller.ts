import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '@/services/dashboard.service';
import type {
    GetFinancialKPIsInput,
    GetCashFlowSummaryInput,
    GetRevenueAnalyticsInput,
    GetExpenseAnalyticsInput,
    GetProfitabilityInput,
    GetBalanceTrendInput,
    GetTopAccountsInput,
} from '@/validators/dashboard.validator';

export class DashboardController {
    // Get Financial KPIs
    async getKPIs(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = req.query as unknown as GetFinancialKPIsInput;
            const kpis = await dashboardService.getFinancialKPIs(filters);

            return res.json({
                success: true,
                data: kpis,
            });
        } catch (error) {
            next(error);
        }
    }

    // Get Cash Flow Summary
    async getCashFlow(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = req.query as unknown as GetCashFlowSummaryInput;
            const cashFlow = await dashboardService.getCashFlowSummary(filters);

            return res.json({
                success: true,
                data: cashFlow,
            });
        } catch (error) {
            next(error);
        }
    }

    // Get Revenue Analytics
    async getRevenue(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = req.query as unknown as GetRevenueAnalyticsInput;
            const revenue = await dashboardService.getRevenueAnalytics(filters);

            return res.json({
                success: true,
                data: revenue.data,
                meta: {
                    currency: revenue.currency,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // Get Expense Analytics
    async getExpenses(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = req.query as unknown as GetExpenseAnalyticsInput;
            const expenses = await dashboardService.getExpenseAnalytics(filters);

            return res.json({
                success: true,
                data: expenses.data,
                meta: {
                    currency: expenses.currency,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // Get Profitability Metrics
    async getProfitability(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = req.query as unknown as GetProfitabilityInput;
            const profitability = await dashboardService.getProfitability(filters);

            return res.json({
                success: true,
                data: profitability,
            });
        } catch (error) {
            next(error);
        }
    }

    // Get Account Balance Trend
    async getBalanceTrend(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = req.query as unknown as GetBalanceTrendInput;
            const trend = await dashboardService.getBalanceTrend(filters);

            return res.json({
                success: true,
                data: trend.data,
                meta: {
                    currency: trend.currency,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // Get Top Accounts by Activity
    async getTopAccounts(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = req.query as unknown as GetTopAccountsInput;
            const topAccounts = await dashboardService.getTopAccounts(filters);

            return res.json({
                success: true,
                data: topAccounts.data,
                meta: {
                    currency: topAccounts.currency,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}

export const dashboardController = new DashboardController();

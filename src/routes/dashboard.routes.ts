import { Router } from 'express';
import { dashboardController } from '@/controllers/dashboard.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validation.middleware';
import {
    getFinancialKPIsSchema,
    getCashFlowSummarySchema,
    getRevenueAnalyticsSchema,
    getExpenseAnalyticsSchema,
    getProfitabilitySchema,
    getBalanceTrendSchema,
    getTopAccountsSchema,
} from '@/validators/dashboard.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get Financial KPIs
router.get(
    '/kpis',
    validate(getFinancialKPIsSchema),
    dashboardController.getKPIs.bind(dashboardController)
);

// Get Cash Flow Summary
router.get(
    '/cash-flow',
    validate(getCashFlowSummarySchema),
    dashboardController.getCashFlow.bind(dashboardController)
);

// Get Revenue Analytics
router.get(
    '/revenue',
    validate(getRevenueAnalyticsSchema),
    dashboardController.getRevenue.bind(dashboardController)
);

// Get Expense Analytics
router.get(
    '/expenses',
    validate(getExpenseAnalyticsSchema),
    dashboardController.getExpenses.bind(dashboardController)
);

// Get Profitability Metrics
router.get(
    '/profitability',
    validate(getProfitabilitySchema),
    dashboardController.getProfitability.bind(dashboardController)
);

// Get Account Balance Trend
router.get(
    '/balance-trend',
    validate(getBalanceTrendSchema),
    dashboardController.getBalanceTrend.bind(dashboardController)
);

// Get Top Accounts by Activity
router.get(
    '/top-accounts',
    validate(getTopAccountsSchema),
    dashboardController.getTopAccounts.bind(dashboardController)
);

export default router;

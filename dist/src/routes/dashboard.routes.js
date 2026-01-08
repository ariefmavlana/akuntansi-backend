"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const dashboard_validator_1 = require("../validators/dashboard.validator");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Get Financial KPIs
router.get('/kpis', (0, validation_middleware_1.validate)(dashboard_validator_1.getFinancialKPIsSchema), dashboard_controller_1.dashboardController.getKPIs.bind(dashboard_controller_1.dashboardController));
// Get Cash Flow Summary
router.get('/cash-flow', (0, validation_middleware_1.validate)(dashboard_validator_1.getCashFlowSummarySchema), dashboard_controller_1.dashboardController.getCashFlow.bind(dashboard_controller_1.dashboardController));
// Get Revenue Analytics
router.get('/revenue', (0, validation_middleware_1.validate)(dashboard_validator_1.getRevenueAnalyticsSchema), dashboard_controller_1.dashboardController.getRevenue.bind(dashboard_controller_1.dashboardController));
// Get Expense Analytics
router.get('/expenses', (0, validation_middleware_1.validate)(dashboard_validator_1.getExpenseAnalyticsSchema), dashboard_controller_1.dashboardController.getExpenses.bind(dashboard_controller_1.dashboardController));
// Get Profitability Metrics
router.get('/profitability', (0, validation_middleware_1.validate)(dashboard_validator_1.getProfitabilitySchema), dashboard_controller_1.dashboardController.getProfitability.bind(dashboard_controller_1.dashboardController));
// Get Account Balance Trend
router.get('/balance-trend', (0, validation_middleware_1.validate)(dashboard_validator_1.getBalanceTrendSchema), dashboard_controller_1.dashboardController.getBalanceTrend.bind(dashboard_controller_1.dashboardController));
// Get Top Accounts by Activity
router.get('/top-accounts', (0, validation_middleware_1.validate)(dashboard_validator_1.getTopAccountsSchema), dashboard_controller_1.dashboardController.getTopAccounts.bind(dashboard_controller_1.dashboardController));
exports.default = router;

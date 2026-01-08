"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopAccountsSchema = exports.getBalanceTrendSchema = exports.getProfitabilitySchema = exports.getExpenseAnalyticsSchema = exports.getRevenueAnalyticsSchema = exports.getCashFlowSummarySchema = exports.getFinancialKPIsSchema = void 0;
const zod_1 = require("zod");
// Get financial KPIs
exports.getFinancialKPIsSchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid(),
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
    }),
});
// Get cash flow summary
exports.getCashFlowSummarySchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid(),
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
        groupBy: zod_1.z.enum(['day', 'week', 'month']).optional(),
    }),
});
// Get revenue analytics
exports.getRevenueAnalyticsSchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid(),
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
        groupBy: zod_1.z.enum(['day', 'week', 'month']).default('month'),
    }),
});
// Get expense analytics
exports.getExpenseAnalyticsSchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid(),
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
        groupBy: zod_1.z.enum(['day', 'week', 'month']).default('month'),
        category: zod_1.z.string().optional(),
    }),
});
// Get profitability metrics
exports.getProfitabilitySchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid(),
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
    }),
});
// Get account balances trend
exports.getBalanceTrendSchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid(),
        akunId: zod_1.z.string().cuid(),
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
        groupBy: zod_1.z.enum(['day', 'week', 'month']).default('month'),
    }),
});
// Get top accounts by activity
exports.getTopAccountsSchema = zod_1.z.object({
    query: zod_1.z.object({
        perusahaanId: zod_1.z.string().cuid(),
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).default('10'),
        tipeAkun: zod_1.z.enum(['ASET', 'LIABILITAS', 'EKUITAS', 'PENDAPATAN', 'BEBAN']).optional(),
    }),
});

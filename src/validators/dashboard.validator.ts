import { z } from 'zod';

// Get financial KPIs
export const getFinancialKPIsSchema = z.object({
    query: z.object({
        perusahaanId: z.string().cuid(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
    }),
});

// Get cash flow summary
export const getCashFlowSummarySchema = z.object({
    query: z.object({
        perusahaanId: z.string().cuid(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        groupBy: z.enum(['day', 'week', 'month']).optional(),
    }),
});

// Get revenue analytics
export const getRevenueAnalyticsSchema = z.object({
    query: z.object({
        perusahaanId: z.string().cuid(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        groupBy: z.enum(['day', 'week', 'month']).default('month'),
    }),
});

// Get expense analytics
export const getExpenseAnalyticsSchema = z.object({
    query: z.object({
        perusahaanId: z.string().cuid(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        groupBy: z.enum(['day', 'week', 'month']).default('month'),
        category: z.string().optional(),
    }),
});

// Get profitability metrics
export const getProfitabilitySchema = z.object({
    query: z.object({
        perusahaanId: z.string().cuid(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
    }),
});

// Get account balances trend
export const getBalanceTrendSchema = z.object({
    query: z.object({
        perusahaanId: z.string().cuid(),
        akunId: z.string().cuid(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        groupBy: z.enum(['day', 'week', 'month']).default('month'),
    }),
});

// Get top accounts by activity
export const getTopAccountsSchema = z.object({
    query: z.object({
        perusahaanId: z.string().cuid(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
        tipeAkun: z.enum(['ASET', 'LIABILITAS', 'EKUITAS', 'PENDAPATAN', 'BEBAN']).optional(),
    }),
});

// Type exports
export type GetFinancialKPIsInput = z.infer<typeof getFinancialKPIsSchema>['query'];
export type GetCashFlowSummaryInput = z.infer<typeof getCashFlowSummarySchema>['query'];
export type GetRevenueAnalyticsInput = z.infer<typeof getRevenueAnalyticsSchema>['query'];
export type GetExpenseAnalyticsInput = z.infer<typeof getExpenseAnalyticsSchema>['query'];
export type GetProfitabilityInput = z.infer<typeof getProfitabilitySchema>['query'];
export type GetBalanceTrendInput = z.infer<typeof getBalanceTrendSchema>['query'];
export type GetTopAccountsInput = z.infer<typeof getTopAccountsSchema>['query'];

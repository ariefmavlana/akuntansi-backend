import { z } from 'zod';

/**
 * Base filter schema for all reports
 */
const baseReportSchema = z.object({
    periodeId: z.string().uuid(),
    perusahaanId: z.string().uuid().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    branchId: z.string().uuid().optional(),
});

/**
 * Balance Sheet (Neraca)
 */
export const getBalanceSheetSchema = z.object({
    query: baseReportSchema.extend({
        asOfDate: z.string().optional(),
    }),
});

export type GetBalanceSheetInput = z.infer<typeof getBalanceSheetSchema>['query'];

/**
 * Income Statement (Laporan Laba Rugi)
 */
export const getIncomeStatementSchema = z.object({
    query: baseReportSchema.extend({
        comparative: z.enum(['none', 'previous_period', 'previous_year']),
    }),
});

export type GetIncomeStatementInput = z.infer<typeof getIncomeStatementSchema>['query'];

/**
 * Cash Flow Statement (Laporan Arus Kas)
 */
export const getCashFlowSchema = z.object({
    query: baseReportSchema.extend({
        method: z.enum(['indirect', 'direct']),
    }),
});

export type GetCashFlowInput = z.infer<typeof getCashFlowSchema>['query'];

/**
 * Changes in Equity (Laporan Perubahan Ekuitas)
 */
export const getEquityChangesSchema = z.object({
    query: baseReportSchema,
});

export type GetEquityChangesInput = z.infer<typeof getEquityChangesSchema>['query'];

/**
 * NOTE: Trial Balance and General Ledger validators are in journal.validator.ts
 * They are re-exported from validators/index.ts
 */

/**
 * Subsidiary Ledger (Buku Pembantu)
 */
export const getSubsidiaryLedgerSchema = z.object({
    query: baseReportSchema.extend({
        ledgerType: z.enum(['accounts_receivable', 'accounts_payable', 'inventory', 'fixed_asset']),
        entityId: z.string().uuid().optional(), // Customer/Supplier/Item ID
    }),
});

export type GetSubsidiaryLedgerInput = z.infer<typeof getSubsidiaryLedgerSchema>['query'];

/**
 * Financial Summary Dashboard
 */
export const getFinancialSummarySchema = z.object({
    query: baseReportSchema,
});

export type GetFinancialSummaryInput = z.infer<typeof getFinancialSummarySchema>['query'];

/**
 * Export Report
 */
export const exportReportSchema = z.object({
    body: z.object({
        reportType: z.enum([
            'balance_sheet',
            'income_statement',
            'cash_flow',
            'equity_changes',
            'trial_balance',
            'general_ledger',
            'subsidiary_ledger',
        ]),
        format: z.enum(['pdf', 'excel']),
        periodeId: z.string().uuid(),
        perusahaanId: z.string().uuid().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        // Additional params for specific reports
        accountId: z.string().uuid().optional(),
        ledgerType: z.string().optional(),
        entityId: z.string().uuid().optional(),
    }),
});

export type ExportReportInput = z.infer<typeof exportReportSchema>['body'];

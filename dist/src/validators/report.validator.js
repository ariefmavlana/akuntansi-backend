"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportReportSchema = exports.getFinancialSummarySchema = exports.getSubsidiaryLedgerSchema = exports.getEquityChangesSchema = exports.getCashFlowSchema = exports.getIncomeStatementSchema = exports.getBalanceSheetSchema = void 0;
const zod_1 = require("zod");
/**
 * Base filter schema for all reports
 */
const baseReportSchema = zod_1.z.object({
    periodeId: zod_1.z.string().uuid(),
    perusahaanId: zod_1.z.string().uuid().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    branchId: zod_1.z.string().uuid().optional(),
});
/**
 * Balance Sheet (Neraca)
 */
exports.getBalanceSheetSchema = zod_1.z.object({
    query: baseReportSchema.extend({
        asOfDate: zod_1.z.string().optional(),
    }),
});
/**
 * Income Statement (Laporan Laba Rugi)
 */
exports.getIncomeStatementSchema = zod_1.z.object({
    query: baseReportSchema.extend({
        comparative: zod_1.z.enum(['none', 'previous_period', 'previous_year']),
    }),
});
/**
 * Cash Flow Statement (Laporan Arus Kas)
 */
exports.getCashFlowSchema = zod_1.z.object({
    query: baseReportSchema.extend({
        method: zod_1.z.enum(['indirect', 'direct']),
    }),
});
/**
 * Changes in Equity (Laporan Perubahan Ekuitas)
 */
exports.getEquityChangesSchema = zod_1.z.object({
    query: baseReportSchema,
});
/**
 * NOTE: Trial Balance and General Ledger validators are in journal.validator.ts
 * They are re-exported from validators/index.ts
 */
/**
 * Subsidiary Ledger (Buku Pembantu)
 */
exports.getSubsidiaryLedgerSchema = zod_1.z.object({
    query: baseReportSchema.extend({
        ledgerType: zod_1.z.enum(['accounts_receivable', 'accounts_payable', 'inventory', 'fixed_asset']),
        entityId: zod_1.z.string().uuid().optional(), // Customer/Supplier/Item ID
    }),
});
/**
 * Financial Summary Dashboard
 */
exports.getFinancialSummarySchema = zod_1.z.object({
    query: baseReportSchema,
});
/**
 * Export Report
 */
exports.exportReportSchema = zod_1.z.object({
    body: zod_1.z.object({
        reportType: zod_1.z.enum([
            'balance_sheet',
            'income_statement',
            'cash_flow',
            'equity_changes',
            'trial_balance',
            'general_ledger',
            'subsidiary_ledger',
        ]),
        format: zod_1.z.enum(['pdf', 'excel']),
        periodeId: zod_1.z.string().uuid(),
        perusahaanId: zod_1.z.string().uuid().optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        // Additional params for specific reports
        accountId: zod_1.z.string().uuid().optional(),
        ledgerType: zod_1.z.string().optional(),
        entityId: zod_1.z.string().uuid().optional(),
    }),
});

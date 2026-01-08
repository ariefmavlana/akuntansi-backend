import { Router } from 'express';
import { reportController } from '@/controllers/report.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validation.middleware';
import {
    getBalanceSheetSchema,
    getIncomeStatementSchema,
    getCashFlowSchema,
    getEquityChangesSchema,
    getFinancialSummarySchema,
    getSubsidiaryLedgerSchema,
    exportReportSchema,
} from '@/validators/report.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/reports/balance-sheet
 * @desc    Get balance sheet (Neraca)
 * @access  Private (Accountant+)
 */
router.get('/balance-sheet', validate(getBalanceSheetSchema), async (req, res) => {
    await reportController.getBalanceSheet(req, res);
});

/**
 * @route   GET /api/v1/reports/income-statement
 * @desc    Get income statement (Laporan Laba Rugi)
 * @access  Private (Accountant+)
 */
router.get('/income-statement', validate(getIncomeStatementSchema), async (req, res) => {
    await reportController.getIncomeStatement(req, res);
});

/**
 * @route   GET /api/v1/reports/cash-flow
 * @desc    Get cash flow statement (Laporan Arus Kas)
 * @access  Private (Accountant+)
 */
router.get('/cash-flow', validate(getCashFlowSchema), async (req, res) => {
    await reportController.getCashFlowStatement(req, res);
});

/**
 * @route   GET /api/v1/reports/equity-changes
 * @desc    Get changes in equity (Laporan Perubahan Ekuitas)
 * @access  Private (Accountant+)
 */
router.get('/equity-changes', validate(getEquityChangesSchema), async (req, res) => {
    await reportController.getEquityChanges(req, res);
});

/**
 * @route   GET /api/v1/reports/summary
 * @desc    Get financial summary dashboard
 * @access  Private (Accountant+)
 */
router.get('/summary', validate(getFinancialSummarySchema), async (req, res) => {
    await reportController.getFinancialSummary(req, res);
});

/**
 * @route   GET /api/v1/reports/subsidiary-ledger
 * @desc    Get subsidiary ledger (Buku Pembantu: AR/AP/Inventory/Fixed Assets)
 * @access  Private (Accountant+)
 * @note    Trial Balance & General Ledger available in /api/v1/journals routes
 */
router.get('/subsidiary-ledger', validate(getSubsidiaryLedgerSchema), async (req, res) => {
    await reportController.getSubsidiaryLedger(req, res);
});

/**
 * @route   POST /api/v1/reports/export
 * @desc    Export report to PDF/Excel
 * @access  Private (Accountant+)
 */
router.post('/export', validate(exportReportSchema), async (req, res) => {
    await reportController.exportReport(req, res);
});

export default router;

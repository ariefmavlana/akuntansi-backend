"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const report_validator_1 = require("../validators/report.validator");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   GET /api/v1/reports/balance-sheet
 * @desc    Get balance sheet (Neraca)
 * @access  Private (Accountant+)
 */
router.get('/balance-sheet', (0, validation_middleware_1.validate)(report_validator_1.getBalanceSheetSchema), async (req, res) => {
    await report_controller_1.reportController.getBalanceSheet(req, res);
});
/**
 * @route   GET /api/v1/reports/income-statement
 * @desc    Get income statement (Laporan Laba Rugi)
 * @access  Private (Accountant+)
 */
router.get('/income-statement', (0, validation_middleware_1.validate)(report_validator_1.getIncomeStatementSchema), async (req, res) => {
    await report_controller_1.reportController.getIncomeStatement(req, res);
});
/**
 * @route   GET /api/v1/reports/cash-flow
 * @desc    Get cash flow statement (Laporan Arus Kas)
 * @access  Private (Accountant+)
 */
router.get('/cash-flow', (0, validation_middleware_1.validate)(report_validator_1.getCashFlowSchema), async (req, res) => {
    await report_controller_1.reportController.getCashFlowStatement(req, res);
});
/**
 * @route   GET /api/v1/reports/equity-changes
 * @desc    Get changes in equity (Laporan Perubahan Ekuitas)
 * @access  Private (Accountant+)
 */
router.get('/equity-changes', (0, validation_middleware_1.validate)(report_validator_1.getEquityChangesSchema), async (req, res) => {
    await report_controller_1.reportController.getEquityChanges(req, res);
});
/**
 * @route   GET /api/v1/reports/summary
 * @desc    Get financial summary dashboard
 * @access  Private (Accountant+)
 */
router.get('/summary', (0, validation_middleware_1.validate)(report_validator_1.getFinancialSummarySchema), async (req, res) => {
    await report_controller_1.reportController.getFinancialSummary(req, res);
});
/**
 * @route   GET /api/v1/reports/subsidiary-ledger
 * @desc    Get subsidiary ledger (Buku Pembantu: AR/AP/Inventory/Fixed Assets)
 * @access  Private (Accountant+)
 * @note    Trial Balance & General Ledger available in /api/v1/journals routes
 */
router.get('/subsidiary-ledger', (0, validation_middleware_1.validate)(report_validator_1.getSubsidiaryLedgerSchema), async (req, res) => {
    await report_controller_1.reportController.getSubsidiaryLedger(req, res);
});
/**
 * @route   POST /api/v1/reports/export
 * @desc    Export report to PDF/Excel
 * @access  Private (Accountant+)
 */
router.post('/export', (0, validation_middleware_1.validate)(report_validator_1.exportReportSchema), async (req, res) => {
    await report_controller_1.reportController.exportReport(req, res);
});
exports.default = router;

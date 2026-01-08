"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportController = exports.ReportController = void 0;
const report_service_1 = require("../services/report.service");
const export_service_1 = require("../services/export.service");
const response_1 = require("../utils/response");
/**
 * Report Controller
 * Handles financial report requests
 */
class ReportController {
    /**
     * Get Balance Sheet (Neraca)
     */
    async getBalanceSheet(req, res) {
        const filters = req.query;
        const userId = req.user.userId;
        const data = await report_service_1.reportService.getBalanceSheet(filters, userId);
        return (0, response_1.successResponse)(res, data, 'Balance sheet generated successfully');
    }
    /**
     * Get Income Statement (Laporan Laba Rugi)
     */
    async getIncomeStatement(req, res) {
        const filters = req.query;
        const userId = req.user.userId;
        const data = await report_service_1.reportService.getIncomeStatement(filters, userId);
        return (0, response_1.successResponse)(res, data, 'Income statement generated successfully');
    }
    /**
     * Get Cash Flow Statement (Laporan Arus Kas)
     */
    async getCashFlowStatement(req, res) {
        const filters = req.query;
        const userId = req.user.userId;
        const data = await report_service_1.reportService.getCashFlowStatement(filters, userId);
        return (0, response_1.successResponse)(res, data, 'Cash flow statement generated successfully');
    }
    /**
     * Get Changes in Equity (Laporan Perubahan Ekuitas)
     */
    async getEquityChanges(req, res) {
        const filters = req.query;
        const userId = req.user.userId;
        const data = await report_service_1.reportService.getEquityChanges(filters, userId);
        return (0, response_1.successResponse)(res, data, 'Equity changes generated successfully');
    }
    /**
     * Get Financial Summary Dashboard
     */
    async getFinancialSummary(req, res) {
        const filters = req.query;
        const userId = req.user.userId;
        const data = await report_service_1.reportService.getFinancialSummary(filters, userId);
        return (0, response_1.successResponse)(res, data, 'Financial summary generated successfully');
    }
    /**
     * Get Subsidiary Ledger (Buku Pembantu)
     */
    async getSubsidiaryLedger(req, res) {
        const filters = req.query; // Using any for ledgerType enum
        const userId = req.user.userId;
        const data = await report_service_1.reportService.getSubsidiaryLedger(filters, userId);
        return (0, response_1.successResponse)(res, data, 'Subsidiary ledger generated successfully');
    }
    /**
     * Export Report to PDF or Excel
     */
    async exportReport(req, res) {
        const input = req.body;
        const userId = req.user.userId;
        let reportData;
        let filename;
        // Get report data based on type
        switch (input.reportType) {
            case 'balance_sheet':
                reportData = await report_service_1.reportService.getBalanceSheet({
                    periodeId: input.periodeId,
                    perusahaanId: input.perusahaanId,
                    startDate: input.startDate,
                    endDate: input.endDate,
                }, userId);
                filename = `Neraca_${new Date().getTime()}`;
                break;
            case 'income_statement':
                reportData = await report_service_1.reportService.getIncomeStatement({
                    periodeId: input.periodeId,
                    perusahaanId: input.perusahaanId,
                    startDate: input.startDate,
                    endDate: input.endDate,
                    comparative: 'none',
                }, userId);
                filename = `LabaRugi_${new Date().getTime()}`;
                break;
            case 'cash_flow':
                reportData = await report_service_1.reportService.getCashFlowStatement({
                    periodeId: input.periodeId,
                    perusahaanId: input.perusahaanId,
                    startDate: input.startDate,
                    endDate: input.endDate,
                    method: 'indirect',
                }, userId);
                filename = `ArusKas_${new Date().getTime()}`;
                break;
            case 'equity_changes':
                reportData = await report_service_1.reportService.getEquityChanges({
                    periodeId: input.periodeId,
                    perusahaanId: input.perusahaanId,
                    startDate: input.startDate,
                    endDate: input.endDate,
                }, userId);
                filename = `PerubahanEkuitas_${new Date().getTime()}`;
                break;
            case 'trial_balance':
            case 'general_ledger':
            case 'subsidiary_ledger':
                return res.status(400).json({
                    success: false,
                    message: 'Export for this report type is not yet implemented',
                });
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid report type',
                });
        }
        // Generate export based on format
        let buffer;
        let contentType;
        let fileExtension;
        if (input.format === 'excel') {
            if (input.reportType === 'balance_sheet') {
                buffer = Buffer.from(await export_service_1.exportService.exportBalanceSheetToExcel(reportData));
            }
            else if (input.reportType === 'income_statement') {
                buffer = Buffer.from(await export_service_1.exportService.exportIncomeStatementToExcel(reportData));
            }
            else if (input.reportType === 'cash_flow') {
                buffer = Buffer.from(await export_service_1.exportService.exportCashFlowToExcel(reportData));
            }
            else if (input.reportType === 'equity_changes') {
                buffer = Buffer.from(await export_service_1.exportService.exportEquityChangesToExcel(reportData));
            }
            else {
                throw new Error('Unsupported report type for Excel export');
            }
            contentType =
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            fileExtension = 'xlsx';
        }
        else if (input.format === 'pdf') {
            if (input.reportType === 'balance_sheet') {
                buffer = await export_service_1.exportService.exportBalanceSheetToPDF(reportData);
            }
            else if (input.reportType === 'income_statement') {
                buffer = await export_service_1.exportService.exportIncomeStatementToPDF(reportData);
            }
            else if (input.reportType === 'cash_flow') {
                buffer = await export_service_1.exportService.exportCashFlowToPDF(reportData);
            }
            else if (input.reportType === 'equity_changes') {
                buffer = await export_service_1.exportService.exportEquityChangesToPDF(reportData);
            }
            else {
                throw new Error('Unsupported report type for PDF export');
            }
            contentType = 'application/pdf';
            fileExtension = 'pdf';
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Invalid format. Use "pdf" or "excel"',
            });
        }
        // Send file
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.${fileExtension}"`);
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);
    }
}
exports.ReportController = ReportController;
exports.reportController = new ReportController();

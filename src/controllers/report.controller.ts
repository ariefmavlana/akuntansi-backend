import { Request, Response } from 'express';
import { reportService } from '@/services/report.service';
import { exportService } from '@/services/export.service';
import { successResponse } from '@/utils/response';
import type {
    GetBalanceSheetInput,
    GetIncomeStatementInput,
    GetCashFlowInput,
    GetEquityChangesInput,
    GetFinancialSummaryInput,
    ExportReportInput,
} from '@/validators/report.validator';

/**
 * Report Controller
 * Handles financial report requests
 */
export class ReportController {
    /**
     * Get Balance Sheet (Neraca)
     */
    async getBalanceSheet(req: Request, res: Response) {
        const filters = req.query as unknown as GetBalanceSheetInput;
        const userId = req.user!.userId;

        const data = await reportService.getBalanceSheet(filters, userId);
        return successResponse(res, data, 'Balance sheet generated successfully');
    }

    /**
     * Get Income Statement (Laporan Laba Rugi)
     */
    async getIncomeStatement(req: Request, res: Response) {
        const filters = req.query as unknown as GetIncomeStatementInput;
        const userId = req.user!.userId;

        const data = await reportService.getIncomeStatement(filters, userId);
        return successResponse(res, data, 'Income statement generated successfully');
    }

    /**
     * Get Cash Flow Statement (Laporan Arus Kas)
     */
    async getCashFlowStatement(req: Request, res: Response) {
        const filters = req.query as unknown as GetCashFlowInput;
        const userId = req.user!.userId;

        const data = await reportService.getCashFlowStatement(filters, userId);
        return successResponse(res, data, 'Cash flow statement generated successfully');
    }

    /**
     * Get Changes in Equity (Laporan Perubahan Ekuitas)
     */
    async getEquityChanges(req: Request, res: Response) {
        const filters = req.query as unknown as GetEquityChangesInput;
        const userId = req.user!.userId;

        const data = await reportService.getEquityChanges(filters, userId);
        return successResponse(res, data, 'Equity changes generated successfully');
    }

    /**
     * Get Financial Summary Dashboard
     */
    async getFinancialSummary(req: Request, res: Response) {
        const filters = req.query as unknown as GetFinancialSummaryInput;
        const userId = req.user!.userId;

        const data = await reportService.getFinancialSummary(filters, userId);
        return successResponse(res, data, 'Financial summary generated successfully');
    }

    /**
     * Get Subsidiary Ledger (Buku Pembantu)
     */
    async getSubsidiaryLedger(req: Request, res: Response) {
        const filters = req.query as unknown as any; // Using any for ledgerType enum
        const userId = req.user!.userId;

        const data = await reportService.getSubsidiaryLedger(filters, userId);
        return successResponse(res, data, 'Subsidiary ledger generated successfully');
    }

    /**
     * Export Report to PDF or Excel
     */
    async exportReport(req: Request, res: Response) {
        const input = req.body as ExportReportInput;
        const userId = req.user!.userId;

        let reportData: any;
        let filename: string;

        // Get report data based on type
        switch (input.reportType) {
            case 'balance_sheet':
                reportData = await reportService.getBalanceSheet(
                    {
                        periodeId: input.periodeId,
                        perusahaanId: input.perusahaanId,
                        startDate: input.startDate,
                        endDate: input.endDate,
                    },
                    userId
                );
                filename = `Neraca_${new Date().getTime()}`;
                break;

            case 'income_statement':
                reportData = await reportService.getIncomeStatement(
                    {
                        periodeId: input.periodeId,
                        perusahaanId: input.perusahaanId,
                        startDate: input.startDate,
                        endDate: input.endDate,
                        comparative: 'none',
                    },
                    userId
                );
                filename = `LabaRugi_${new Date().getTime()}`;
                break;

            case 'cash_flow':
                reportData = await reportService.getCashFlowStatement(
                    {
                        periodeId: input.periodeId,
                        perusahaanId: input.perusahaanId,
                        startDate: input.startDate,
                        endDate: input.endDate,
                        method: 'indirect',
                    },
                    userId
                );
                filename = `ArusKas_${new Date().getTime()}`;
                break;

            case 'equity_changes':
                reportData = await reportService.getEquityChanges(
                    {
                        periodeId: input.periodeId,
                        perusahaanId: input.perusahaanId,
                        startDate: input.startDate,
                        endDate: input.endDate,
                    },
                    userId
                );
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
        let buffer: Buffer;
        let contentType: string;
        let fileExtension: string;

        if (input.format === 'excel') {
            if (input.reportType === 'balance_sheet') {
                buffer = Buffer.from(await exportService.exportBalanceSheetToExcel(reportData));
            } else if (input.reportType === 'income_statement') {
                buffer = Buffer.from(await exportService.exportIncomeStatementToExcel(reportData));
            } else if (input.reportType === 'cash_flow') {
                buffer = Buffer.from(await exportService.exportCashFlowToExcel(reportData));
            } else if (input.reportType === 'equity_changes') {
                buffer = Buffer.from(await exportService.exportEquityChangesToExcel(reportData));
            } else {
                throw new Error('Unsupported report type for Excel export');
            }
            contentType =
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            fileExtension = 'xlsx';
        } else if (input.format === 'pdf') {
            if (input.reportType === 'balance_sheet') {
                buffer = await exportService.exportBalanceSheetToPDF(reportData);
            } else if (input.reportType === 'income_statement') {
                buffer = await exportService.exportIncomeStatementToPDF(reportData);
            } else if (input.reportType === 'cash_flow') {
                buffer = await exportService.exportCashFlowToPDF(reportData);
            } else if (input.reportType === 'equity_changes') {
                buffer = await exportService.exportEquityChangesToPDF(reportData);
            } else {
                throw new Error('Unsupported report type for PDF export');
            }
            contentType = 'application/pdf';
            fileExtension = 'pdf';
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid format. Use "pdf" or "excel"',
            });
        }

        // Send file
        res.setHeader('Content-Type', contentType);
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${filename}.${fileExtension}"`
        );
        res.setHeader('Content-Length', buffer.length);

        return res.send(buffer);
    }
}

export const reportController = new ReportController();

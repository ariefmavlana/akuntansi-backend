"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportService = exports.ExportService = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
const pdfkit_1 = __importDefault(require("pdfkit"));
/**
 * Export Service
 * Handles PDF and Excel export for financial reports
 */
class ExportService {
    /**
     * Export Balance Sheet to Excel
     */
    async exportBalanceSheetToExcel(data) {
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('Neraca');
        // Set column widths
        worksheet.columns = [
            { width: 40 },
            { width: 20 },
        ];
        // Title
        worksheet.mergeCells('A1:B1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'NERACA / LAPORAN POSISI KEUANGAN';
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center' };
        // Date
        worksheet.mergeCells('A2:B2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Per tanggal: ${new Date(data.tanggalLaporan).toLocaleDateString('id-ID')}`;
        dateCell.alignment = { horizontal: 'center' };
        worksheet.addRow([]);
        // ASET Section
        const asetHeaderRow = worksheet.addRow(['ASET', '']);
        asetHeaderRow.font = { bold: true };
        asetHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        data.aset.accounts.forEach((account) => {
            worksheet.addRow([`  ${account.namaAkun}`, account.saldo]);
        });
        const asetTotalRow = worksheet.addRow(['TOTAL ASET', data.aset.total]);
        asetTotalRow.font = { bold: true };
        worksheet.addRow([]);
        // LIABILITAS Section
        const liabilitasHeaderRow = worksheet.addRow(['LIABILITAS', '']);
        liabilitasHeaderRow.font = { bold: true };
        liabilitasHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        data.liabilitas.accounts.forEach((account) => {
            worksheet.addRow([`  ${account.namaAkun}`, account.saldo]);
        });
        const liabilitasTotalRow = worksheet.addRow(['TOTAL LIABILITAS', data.liabilitas.total]);
        liabilitasTotalRow.font = { bold: true };
        worksheet.addRow([]);
        // EKUITAS Section
        const ekuitasHeaderRow = worksheet.addRow(['EKUITAS', '']);
        ekuitasHeaderRow.font = { bold: true };
        ekuitasHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        data.ekuitas.accounts.forEach((account) => {
            worksheet.addRow([`  ${account.namaAkun}`, account.saldo]);
        });
        const ekuitasTotalRow = worksheet.addRow(['TOTAL EKUITAS', data.ekuitas.total]);
        ekuitasTotalRow.font = { bold: true };
        worksheet.addRow([]);
        // Balance Check
        const balanceRow = worksheet.addRow([
            'ASET = LIABILITAS + EKUITAS',
            data.balanced ? '✓ BALANCE' : '✗ NOT BALANCE',
        ]);
        balanceRow.font = { bold: true };
        balanceRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: data.balanced ? 'FF90EE90' : 'FFFF6B6B' },
        };
        // Format numbers
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 2) {
                const valueCell = row.getCell(2);
                if (typeof valueCell.value === 'number') {
                    valueCell.numFmt = '#,##0.00';
                }
            }
        });
        return await workbook.xlsx.writeBuffer();
    }
    /**
     * Export Income Statement to Excel
     */
    async exportIncomeStatementToExcel(data) {
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('Laba Rugi');
        worksheet.columns = [
            { width: 40 },
            { width: 20 },
        ];
        // Title
        worksheet.mergeCells('A1:B1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'LAPORAN LABA RUGI';
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center' };
        // Period
        worksheet.mergeCells('A2:B2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Periode: ${new Date(data.startDate).toLocaleDateString('id-ID')} - ${new Date(data.endDate).toLocaleDateString('id-ID')}`;
        dateCell.alignment = { horizontal: 'center' };
        worksheet.addRow([]);
        // PENDAPATAN Section
        const pendapatanHeaderRow = worksheet.addRow(['PENDAPATAN', '']);
        pendapatanHeaderRow.font = { bold: true };
        pendapatanHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        data.pendapatan.accounts.forEach((account) => {
            worksheet.addRow([`  ${account.namaAkun}`, account.jumlah]);
        });
        const pendapatanTotalRow = worksheet.addRow(['TOTAL PENDAPATAN', data.pendapatan.total]);
        pendapatanTotalRow.font = { bold: true };
        worksheet.addRow([]);
        // BEBAN Section
        const bebanHeaderRow = worksheet.addRow(['BEBAN', '']);
        bebanHeaderRow.font = { bold: true };
        bebanHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        data.beban.accounts.forEach((account) => {
            worksheet.addRow([`  ${account.namaAkun}`, account.jumlah]);
        });
        const bebanTotalRow = worksheet.addRow(['TOTAL BEBAN', data.beban.total]);
        bebanTotalRow.font = { bold: true };
        worksheet.addRow([]);
        // Laba Bersih
        const labaBersihRow = worksheet.addRow(['LABA (RUGI) BERSIH', data.labaBersih]);
        labaBersihRow.font = { bold: true, size: 12 };
        labaBersihRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: data.labaBersih >= 0 ? 'FF90EE90' : 'FFFF6B6B' },
        };
        // Format numbers
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 2) {
                const valueCell = row.getCell(2);
                if (typeof valueCell.value === 'number') {
                    valueCell.numFmt = '#,##0.00';
                }
            }
        });
        return await workbook.xlsx.writeBuffer();
    }
    /**
     * Export Balance Sheet to PDF
     */
    async exportBalanceSheetToPDF(data) {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 50 });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            // Title
            doc.fontSize(16).font('Helvetica-Bold').text('NERACA / LAPORAN POSISI KEUANGAN', {
                align: 'center',
            });
            doc.fontSize(10)
                .font('Helvetica')
                .text(`Per tanggal: ${new Date(data.tanggalLaporan).toLocaleDateString('id-ID')}`, {
                align: 'center',
            });
            doc.moveDown();
            // ASET
            doc.fontSize(12).font('Helvetica-Bold').text('ASET');
            doc.fontSize(10).font('Helvetica');
            data.aset.accounts.forEach((account) => {
                doc.text(`  ${account.namaAkun}`, 100, doc.y, { continued: true });
                doc.text(account.saldo.toLocaleString('id-ID'), { align: 'right' });
            });
            doc.moveDown();
            doc.font('Helvetica-Bold').text('TOTAL ASET', 100, doc.y, { continued: true });
            doc.text(data.aset.total.toLocaleString('id-ID'), { align: 'right' });
            doc.moveDown(2);
            // LIABILITAS
            doc.fontSize(12).font('Helvetica-Bold').text('LIABILITAS');
            doc.fontSize(10).font('Helvetica');
            data.liabilitas.accounts.forEach((account) => {
                doc.text(`  ${account.namaAkun}`, 100, doc.y, { continued: true });
                doc.text(account.saldo.toLocaleString('id-ID'), { align: 'right' });
            });
            doc.moveDown();
            doc.font('Helvetica-Bold').text('TOTAL LIABILITAS', 100, doc.y, { continued: true });
            doc.text(data.liabilitas.total.toLocaleString('id-ID'), { align: 'right' });
            doc.moveDown(2);
            // EKUITAS
            doc.fontSize(12).font('Helvetica-Bold').text('EKUITAS');
            doc.fontSize(10).font('Helvetica');
            data.ekuitas.accounts.forEach((account) => {
                doc.text(`  ${account.namaAkun}`, 100, doc.y, { continued: true });
                doc.text(account.saldo.toLocaleString('id-ID'), { align: 'right' });
            });
            doc.moveDown();
            doc.font('Helvetica-Bold').text('TOTAL EKUITAS', 100, doc.y, { continued: true });
            doc.text(data.ekuitas.total.toLocaleString('id-ID'), { align: 'right' });
            doc.moveDown(2);
            // Balance check
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .text(`ASET = LIABILITAS + EKUITAS: ${data.balanced ? '✓ BALANCE' : '✗ NOT BALANCE'}`, { align: 'center' });
            doc.end();
        });
    }
    /**
     * Export Income Statement to PDF
     */
    async exportIncomeStatementToPDF(data) {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 50 });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            // Title
            doc.fontSize(16).font('Helvetica-Bold').text('LAPORAN LABA RUGI', {
                align: 'center',
            });
            doc.fontSize(10)
                .font('Helvetica')
                .text(`Periode: ${new Date(data.startDate).toLocaleDateString('id-ID')} - ${new Date(data.endDate).toLocaleDateString('id-ID')}`, { align: 'center' });
            doc.moveDown();
            // PENDAPATAN
            doc.fontSize(12).font('Helvetica-Bold').text('PENDAPATAN');
            doc.fontSize(10).font('Helvetica');
            data.pendapatan.accounts.forEach((account) => {
                doc.text(`  ${account.namaAkun}`, 100, doc.y, { continued: true });
                doc.text(account.jumlah.toLocaleString('id-ID'), { align: 'right' });
            });
            doc.moveDown();
            doc.font('Helvetica-Bold').text('TOTAL PENDAPATAN', 100, doc.y, { continued: true });
            doc.text(data.pendapatan.total.toLocaleString('id-ID'), { align: 'right' });
            doc.moveDown(2);
            // BEBAN
            doc.fontSize(12).font('Helvetica-Bold').text('BEBAN');
            doc.fontSize(10).font('Helvetica');
            data.beban.accounts.forEach((account) => {
                doc.text(`  ${account.namaAkun}`, 100, doc.y, { continued: true });
                doc.text(account.jumlah.toLocaleString('id-ID'), { align: 'right' });
            });
            doc.moveDown();
            doc.font('Helvetica-Bold').text('TOTAL BEBAN', 100, doc.y, { continued: true });
            doc.text(data.beban.total.toLocaleString('id-ID'), { align: 'right' });
            doc.moveDown(2);
            // Laba Bersih
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .text('LABA (RUGI) BERSIH', 100, doc.y, { continued: true });
            doc.text(data.labaBersih.toLocaleString('id-ID'), { align: 'right' });
            doc.end();
        });
    }
    /**
     * Export Cash Flow Statement to Excel
     */
    async exportCashFlowToExcel(data) {
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('Arus Kas');
        worksheet.columns = [
            { width: 40 },
            { width: 20 },
        ];
        // Title
        worksheet.mergeCells('A1:B1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'LAPORAN ARUS KAS';
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center' };
        // Period
        worksheet.mergeCells('A2:B2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Periode: ${new Date(data.startDate).toLocaleDateString('id-ID')} - ${new Date(data.endDate).toLocaleDateString('id-ID')}`;
        dateCell.alignment = { horizontal: 'center' };
        worksheet.addRow([]);
        // Opening Balance
        const openingRow = worksheet.addRow(['Saldo Kas Awal Periode', data.openingBalance]);
        openingRow.font = { bold: true };
        worksheet.addRow([]);
        // Operating Activities
        const operatingHeaderRow = worksheet.addRow(['AKTIVITAS OPERASI', '']);
        operatingHeaderRow.font = { bold: true };
        operatingHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        worksheet.addRow(['  Penerimaan Kas', data.operating.cashIn]);
        worksheet.addRow(['  Pengeluaran Kas', -data.operating.cashOut]);
        const operatingNetRow = worksheet.addRow(['  Kas Bersih dari Operasi', data.operating.netCashFlow]);
        operatingNetRow.font = { bold: true };
        worksheet.addRow([]);
        // Investing Activities
        const investingHeaderRow = worksheet.addRow(['AKTIVITAS INVESTASI', '']);
        investingHeaderRow.font = { bold: true };
        investingHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        worksheet.addRow(['  Penerimaan Kas', data.investing.cashIn]);
        worksheet.addRow(['  Pengeluaran Kas', -data.investing.cashOut]);
        const investingNetRow = worksheet.addRow(['  Kas Bersih dari Investasi', data.investing.netCashFlow]);
        investingNetRow.font = { bold: true };
        worksheet.addRow([]);
        // Financing Activities
        const financingHeaderRow = worksheet.addRow(['AKTIVITAS PENDANAAN', '']);
        financingHeaderRow.font = { bold: true };
        financingHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        worksheet.addRow(['  Penerimaan Kas', data.financing.cashIn]);
        worksheet.addRow(['  Pengeluaran Kas', -data.financing.cashOut]);
        const financingNetRow = worksheet.addRow(['  Kas Bersih dari Pendanaan', data.financing.netCashFlow]);
        financingNetRow.font = { bold: true };
        worksheet.addRow([]);
        // Net Cash Flow
        const netCashFlowRow = worksheet.addRow(['KENAIKAN (PENURUNAN) KAS', data.netCashFlow]);
        netCashFlowRow.font = { bold: true, size: 12 };
        netCashFlowRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: data.netCashFlow >= 0 ? 'FF90EE90' : 'FFFF6B6B' },
        };
        // Closing Balance
        const closingRow = worksheet.addRow(['Saldo Kas Akhir Periode', data.closingBalance]);
        closingRow.font = { bold: true };
        // Format numbers
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 2) {
                const valueCell = row.getCell(2);
                if (typeof valueCell.value === 'number') {
                    valueCell.numFmt = '#,##0.00';
                }
            }
        });
        return await workbook.xlsx.writeBuffer();
    }
    /**
     * Export Cash Flow Statement to PDF
     */
    async exportCashFlowToPDF(data) {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 50 });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            // Title
            doc.fontSize(16).font('Helvetica-Bold').text('LAPORAN ARUS KAS', {
                align: 'center',
            });
            doc.fontSize(10)
                .font('Helvetica')
                .text(`Periode: ${new Date(data.startDate).toLocaleDateString('id-ID')} - ${new Date(data.endDate).toLocaleDateString('id-ID')}`, { align: 'center' });
            doc.moveDown();
            // Opening Balance
            doc.fontSize(11).font('Helvetica-Bold').text('Saldo Kas Awal Periode', 100, doc.y, { continued: true });
            doc.text(data.openingBalance.toLocaleString('id-ID'), { align: 'right' });
            doc.moveDown();
            // Operating Activities
            doc.fontSize(12).font('Helvetica-Bold').text('AKTIVITAS OPERASI');
            doc.fontSize(10).font('Helvetica');
            doc.text(`  Penerimaan Kas`, 100, doc.y, { continued: true });
            doc.text(data.operating.cashIn.toLocaleString('id-ID'), { align: 'right' });
            doc.text(`  Pengeluaran Kas`, 100, doc.y, { continued: true });
            doc.text((-data.operating.cashOut).toLocaleString('id-ID'), { align: 'right' });
            doc.font('Helvetica-Bold').text(`  Kas Bersih dari Operasi`, 100, doc.y, { continued: true });
            doc.text(data.operating.netCashFlow.toLocaleString('id-ID'), { align: 'right' });
            doc.moveDown();
            // Investing Activities
            doc.fontSize(12).font('Helvetica-Bold').text('AKTIVITAS INVESTASI');
            doc.fontSize(10).font('Helvetica');
            doc.text(`  Penerimaan Kas`, 100, doc.y, { continued: true });
            doc.text(data.investing.cashIn.toLocaleString('id-ID'), { align: 'right' });
            doc.text(`  Pengeluaran Kas`, 100, doc.y, { continued: true });
            doc.text((-data.investing.cashOut).toLocaleString('id-ID'), { align: 'right' });
            doc.font('Helvetica-Bold').text(`  Kas Bersih dari Investasi`, 100, doc.y, { continued: true });
            doc.text(data.investing.netCashFlow.toLocaleString('id-ID'), { align: 'right' });
            doc.moveDown();
            // Financing Activities
            doc.fontSize(12).font('Helvetica-Bold').text('AKTIVITAS PENDANAAN');
            doc.fontSize(10).font('Helvetica');
            doc.text(`  Penerimaan Kas`, 100, doc.y, { continued: true });
            doc.text(data.financing.cashIn.toLocaleString('id-ID'), { align: 'right' });
            doc.text(`  Pengeluaran Kas`, 100, doc.y, { continued: true });
            doc.text((-data.financing.cashOut).toLocaleString('id-ID'), { align: 'right' });
            doc.font('Helvetica-Bold').text(`  Kas Bersih dari Pendanaan`, 100, doc.y, { continued: true });
            doc.text(data.financing.netCashFlow.toLocaleString('id-ID'), { align: 'right' });
            doc.moveDown(2);
            // Net Cash Flow
            doc.fontSize(11).font('Helvetica-Bold').text('KENAIKAN (PENURUNAN) KAS', 100, doc.y, { continued: true });
            doc.text(data.netCashFlow.toLocaleString('id-ID'), { align: 'right' });
            // Closing Balance
            doc.text('Saldo Kas Akhir Periode', 100, doc.y, { continued: true });
            doc.text(data.closingBalance.toLocaleString('id-ID'), { align: 'right' });
            doc.end();
        });
    }
    /**
     * Export Equity Changes to Excel
     */
    async exportEquityChangesToExcel(data) {
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet('Perubahan Ekuitas');
        worksheet.columns = [
            { width: 40 },
            { width: 20 },
        ];
        // Title
        worksheet.mergeCells('A1:B1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'LAPORAN PERUBAHAN EKUITAS';
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center' };
        // Period
        worksheet.mergeCells('A2:B2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Periode: ${new Date(data.startDate).toLocaleDateString('id-ID')} - ${new Date(data.endDate).toLocaleDateString('id-ID')}`;
        dateCell.alignment = { horizontal: 'center' };
        worksheet.addRow([]);
        // Opening Balance
        const openingRow = worksheet.addRow(['Saldo Ekuitas Awal', data.openingBalance]);
        openingRow.font = { bold: true };
        openingRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        worksheet.addRow([]);
        // Changes
        worksheet.addRow(['Penambahan Ekuitas', data.additions]);
        worksheet.addRow(['Pengurangan Ekuitas', -data.reductions]);
        worksheet.addRow([]);
        const netChangeRow = worksheet.addRow(['Perubahan Bersih', data.netChange]);
        netChangeRow.font = { bold: true };
        netChangeRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: data.netChange >= 0 ? 'FF90EE90' : 'FFFF6B6B' },
        };
        worksheet.addRow([]);
        // Closing Balance
        const closingRow = worksheet.addRow(['Saldo Ekuitas Akhir', data.closingBalance]);
        closingRow.font = { bold: true, size: 12 };
        closingRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFD700' },
        };
        worksheet.addRow([]);
        worksheet.addRow([]);
        // Account Details
        const detailHeaderRow = worksheet.addRow(['RINCIAN PER AKUN', '']);
        detailHeaderRow.font = { bold: true };
        detailHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };
        worksheet.addRow(['Nama Akun', 'Saldo Akhir']);
        data.accounts.forEach((account) => {
            worksheet.addRow([account.namaAkun, account.saldoAkhir]);
        });
        // Format numbers
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 2) {
                const valueCell = row.getCell(2);
                if (typeof valueCell.value === 'number') {
                    valueCell.numFmt = '#,##0.00';
                }
            }
        });
        return await workbook.xlsx.writeBuffer();
    }
    /**
     * Export Equity Changes to PDF
     */
    async exportEquityChangesToPDF(data) {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 50 });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            // Title
            doc.fontSize(16).font('Helvetica-Bold').text('LAPORAN PERUBAHAN EKUITAS', {
                align: 'center',
            });
            doc.fontSize(10)
                .font('Helvetica')
                .text(`Periode: ${new Date(data.startDate).toLocaleDateString('id-ID')} - ${new Date(data.endDate).toLocaleDateString('id-ID')}`, { align: 'center' });
            doc.moveDown();
            // Opening Balance
            doc.fontSize(11).font('Helvetica-Bold').text('Saldo Ekuitas Awal', 100, doc.y, { continued: true });
            doc.text(data.openingBalance.toLocaleString('id-ID'), { align: 'right' });
            doc.moveDown();
            // Changes
            doc.fontSize(10).font('Helvetica');
            doc.text('Penambahan Ekuitas', 100, doc.y, { continued: true });
            doc.text(data.additions.toLocaleString('id-ID'), { align: 'right' });
            doc.text('Pengurangan Ekuitas', 100, doc.y, { continued: true });
            doc.text((-data.reductions).toLocaleString('id-ID'), { align: 'right' });
            doc.moveDown();
            doc.font('Helvetica-Bold').text('Perubahan Bersih', 100, doc.y, { continued: true });
            doc.text(data.netChange.toLocaleString('id-ID'), { align: 'right' });
            doc.moveDown(2);
            // Closing Balance
            doc.fontSize(12).font('Helvetica-Bold').text('Saldo Ekuitas Akhir', 100, doc.y, { continued: true });
            doc.text(data.closingBalance.toLocaleString('id-ID'), { align: 'right' });
            doc.moveDown(2);
            // Account Details
            doc.fontSize(11).font('Helvetica-Bold').text('RINCIAN PER AKUN');
            doc.fontSize(10).font('Helvetica');
            data.accounts.forEach((account) => {
                doc.text(`  ${account.namaAkun}`, 100, doc.y, { continued: true });
                doc.text(account.saldoAkhir.toLocaleString('id-ID'), { align: 'right' });
            });
            doc.end();
        });
    }
}
exports.ExportService = ExportService;
exports.exportService = new ExportService();

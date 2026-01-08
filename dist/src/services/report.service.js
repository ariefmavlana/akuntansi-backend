"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = exports.ReportService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const auth_service_1 = require("./auth.service");
/**
 * Report Service
 * Handles PSAK-compliant financial reports
 */
class ReportService {
    /**
     * Get Balance Sheet (Neraca / Laporan Posisi Keuangan)
     * ASET = LIABILITAS + EKUITAS
     */
    async getBalanceSheet(filters, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser)
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            const perusahaanId = requestingUser.role === 'SUPERADMIN' ? filters.perusahaanId : requestingUser.perusahaanId;
            if (!perusahaanId)
                throw new auth_service_1.ValidationError('perusahaanId required');
            // Get periode
            const periode = await database_1.default.periodeAkuntansi.findUnique({
                where: { id: filters.periodeId },
            });
            if (!periode)
                throw new auth_service_1.ValidationError('Periode tidak ditemukan');
            // Build where clause
            const where = {
                perusahaanId,
            };
            // Get all accounts
            const accounts = await database_1.default.chartOfAccounts.findMany({
                where,
                orderBy: { kodeAkun: 'asc' },
            });
            // Group by tipe akun
            const aset = accounts.filter((a) => a.tipe === 'ASET');
            const liabilitas = accounts.filter((a) => a.tipe === 'LIABILITAS');
            const ekuitas = accounts.filter((a) => a.tipe === 'EKUITAS');
            // Calculate totals
            const totalAset = aset.reduce((sum, a) => sum + a.saldoBerjalan.toNumber(), 0);
            const totalLiabilitas = liabilitas.reduce((sum, a) => sum + a.saldoBerjalan.toNumber(), 0);
            const totalEkuitas = ekuitas.reduce((sum, a) => sum + a.saldoBerjalan.toNumber(), 0);
            // Check balance: ASET = LIABILITAS + EKUITAS
            const balanced = Math.abs(totalAset - (totalLiabilitas + totalEkuitas)) < 0.01;
            logger_1.default.info(`Balance Sheet generated for company: ${perusahaanId}`);
            return {
                perusahaanId,
                periodeId: filters.periodeId,
                tanggalLaporan: filters.asOfDate || new Date().toISOString(),
                aset: {
                    accounts: aset.map((a) => ({
                        kodeAkun: a.kodeAkun,
                        namaAkun: a.namaAkun,
                        saldo: a.saldoBerjalan.toNumber(),
                    })),
                    total: totalAset,
                },
                liabilitas: {
                    accounts: liabilitas.map((a) => ({
                        kodeAkun: a.kodeAkun,
                        namaAkun: a.namaAkun,
                        saldo: a.saldoBerjalan.toNumber(),
                    })),
                    total: totalLiabilitas,
                },
                ekuitas: {
                    accounts: ekuitas.map((a) => ({
                        kodeAkun: a.kodeAkun,
                        namaAkun: a.namaAkun,
                        saldo: a.saldoBerjalan.toNumber(),
                    })),
                    total: totalEkuitas,
                },
                balanced,
                balanceDifference: totalAset - (totalLiabilitas + totalEkuitas),
            };
        }
        catch (error) {
            logger_1.default.error('Get balance sheet error:', error);
            throw error;
        }
    }
    /**
     * Get Income Statement (Laporan Laba Rugi)
     * Laba/Rugi = PENDAPATAN - BEBAN
     */
    async getIncomeStatement(filters, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser)
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            const perusahaanId = requestingUser.role === 'SUPERADMIN' ? filters.perusahaanId : requestingUser.perusahaanId;
            if (!perusahaanId)
                throw new auth_service_1.ValidationError('perusahaanId required');
            // Get periode
            const periode = await database_1.default.periodeAkuntansi.findUnique({
                where: { id: filters.periodeId },
            });
            if (!periode)
                throw new auth_service_1.ValidationError('Periode tidak ditemukan');
            // Date range
            const startDate = filters.startDate ? new Date(filters.startDate) : periode.tanggalMulai;
            const endDate = filters.endDate ? new Date(filters.endDate) : periode.tanggalAkhir;
            // Get journal details for the period
            const journalDetails = await database_1.default.jurnalDetail.findMany({
                where: {
                    jurnal: {
                        perusahaanId,
                        tanggal: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                },
                include: {
                    akun: true,
                },
            });
            // Separate PENDAPATAN and BEBAN
            const pendapatan = journalDetails.filter((d) => d.akun.tipe === 'PENDAPATAN');
            const beban = journalDetails.filter((d) => d.akun.tipe === 'BEBAN');
            // Calculate totals (Kredit for PENDAPATAN, Debit for BEBAN)
            const totalPendapatan = pendapatan.reduce((sum, d) => sum + d.kredit.toNumber() - d.debit.toNumber(), 0);
            const totalBeban = beban.reduce((sum, d) => sum + d.debit.toNumber() - d.kredit.toNumber(), 0);
            const labaBersih = totalPendapatan - totalBeban;
            logger_1.default.info(`Income Statement generated for company: ${perusahaanId}`);
            return {
                perusahaanId,
                periodeId: filters.periodeId,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                pendapatan: {
                    accounts: this.groupByAccount(pendapatan),
                    total: totalPendapatan,
                },
                beban: {
                    accounts: this.groupByAccount(beban),
                    total: totalBeban,
                },
                labaBersih,
            };
        }
        catch (error) {
            logger_1.default.error('Get income statement error:', error);
            throw error;
        }
    }
    /**
     * Get Cash Flow Statement (Laporan Arus Kas)
     * 3 sections: Operating, Investing, Financing
     */
    async getCashFlowStatement(filters, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser)
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            const perusahaanId = requestingUser.role === 'SUPERADMIN' ? filters.perusahaanId : requestingUser.perusahaanId;
            if (!perusahaanId)
                throw new auth_service_1.ValidationError('perusahaanId required');
            // Get periode
            const periode = await database_1.default.periodeAkuntansi.findUnique({
                where: { id: filters.periodeId },
            });
            if (!periode)
                throw new auth_service_1.ValidationError('Periode tidak ditemukan');
            const startDate = filters.startDate ? new Date(filters.startDate) : periode.tanggalMulai;
            const endDate = filters.endDate ? new Date(filters.endDate) : periode.tanggalAkhir;
            // Get cash accounts (Kas dan Bank)
            const cashAccounts = await database_1.default.chartOfAccounts.findMany({
                where: {
                    perusahaanId,
                    kodeAkun: {
                        startsWith: '1-1-1', // Kas dan Setara Kas
                    },
                },
            });
            const cashAccountIds = cashAccounts.map((a) => a.id);
            // Get cash movements
            const cashMovements = await database_1.default.jurnalDetail.findMany({
                where: {
                    akunId: { in: cashAccountIds },
                    jurnal: {
                        perusahaanId,
                        tanggal: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                },
                include: {
                    jurnal: true,
                    akun: true,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });
            // Calculate total cash flow
            const totalCashIn = cashMovements.reduce((sum, m) => sum + m.debit.toNumber(), 0);
            const totalCashOut = cashMovements.reduce((sum, m) => sum + m.kredit.toNumber(), 0);
            const netCashFlow = totalCashIn - totalCashOut;
            // Opening balance
            const openingBalance = cashAccounts.reduce((sum, a) => sum + (a.saldoAwal?.toNumber() || 0), 0);
            const closingBalance = cashAccounts.reduce((sum, a) => sum + a.saldoBerjalan.toNumber(), 0);
            logger_1.default.info(`Cash Flow Statement generated for company: ${perusahaanId}`);
            return {
                perusahaanId,
                periodeId: filters.periodeId,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                openingBalance,
                operating: {
                    cashIn: totalCashIn,
                    cashOut: totalCashOut,
                    netCashFlow: totalCashIn - totalCashOut,
                },
                investing: {
                    cashIn: 0, // Placeholder
                    cashOut: 0,
                    netCashFlow: 0,
                },
                financing: {
                    cashIn: 0, // Placeholder
                    cashOut: 0,
                    netCashFlow: 0,
                },
                netCashFlow,
                closingBalance,
            };
        }
        catch (error) {
            logger_1.default.error('Get cash flow statement error:', error);
            throw error;
        }
    }
    /**
     * Get Changes in Equity (Laporan Perubahan Ekuitas)
     */
    async getEquityChanges(filters, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser)
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            const perusahaanId = requestingUser.role === 'SUPERADMIN' ? filters.perusahaanId : requestingUser.perusahaanId;
            if (!perusahaanId)
                throw new auth_service_1.ValidationError('perusahaanId required');
            // Get periode
            const periode = await database_1.default.periodeAkuntansi.findUnique({
                where: { id: filters.periodeId },
            });
            if (!periode)
                throw new auth_service_1.ValidationError('Periode tidak ditemukan');
            const startDate = filters.startDate ? new Date(filters.startDate) : periode.tanggalMulai;
            const endDate = filters.endDate ? new Date(filters.endDate) : periode.tanggalAkhir;
            // Get equity accounts
            const equityAccounts = await database_1.default.chartOfAccounts.findMany({
                where: {
                    perusahaanId,
                    tipe: 'EKUITAS',
                },
                orderBy: { kodeAkun: 'asc' },
            });
            // Get equity movements
            const equityMovements = await database_1.default.jurnalDetail.findMany({
                where: {
                    akunId: { in: equityAccounts.map((a) => a.id) },
                    jurnal: {
                        perusahaanId,
                        tanggal: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                },
                include: {
                    jurnal: true,
                    akun: true,
                },
            });
            // Calculate opening and closing equity
            const openingEquity = equityAccounts.reduce((sum, a) => sum + (a.saldoAwal?.toNumber() || 0), 0);
            const closingEquity = equityAccounts.reduce((sum, a) => sum + a.saldoBerjalan.toNumber(), 0);
            const equityIncrease = equityMovements.reduce((sum, m) => sum + m.kredit.toNumber(), 0);
            const equityDecrease = equityMovements.reduce((sum, m) => sum + m.debit.toNumber(), 0);
            logger_1.default.info(`Equity Changes generated for company: ${perusahaanId}`);
            return {
                perusahaanId,
                periodeId: filters.periodeId,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                openingBalance: openingEquity,
                additions: equityIncrease,
                reductions: equityDecrease,
                netChange: equityIncrease - equityDecrease,
                closingBalance: closingEquity,
                accounts: equityAccounts.map((a) => ({
                    kodeAkun: a.kodeAkun,
                    namaAkun: a.namaAkun,
                    saldoAwal: a.saldoAwal?.toNumber() || 0,
                    saldoAkhir: a.saldoBerjalan.toNumber(),
                })),
            };
        }
        catch (error) {
            logger_1.default.error('Get equity changes error:', error);
            throw error;
        }
    }
    /**
     * Get Financial Summary Dashboard
     */
    async getFinancialSummary(filters, requestingUserId) {
        try {
            // Add required parameters with defaults
            const balanceSheetFilters = { ...filters };
            const incomeStatementFilters = { ...filters, comparative: 'none' };
            const cashFlowFilters = { ...filters, method: 'indirect' };
            const [balanceSheet, incomeStatement, cashFlow] = await Promise.all([
                this.getBalanceSheet(balanceSheetFilters, requestingUserId),
                this.getIncomeStatement(incomeStatementFilters, requestingUserId),
                this.getCashFlowStatement(cashFlowFilters, requestingUserId),
            ]);
            return {
                balanceSheet: {
                    totalAset: balanceSheet.aset.total,
                    totalLiabilitas: balanceSheet.liabilitas.total,
                    totalEkuitas: balanceSheet.ekuitas.total,
                    balanced: balanceSheet.balanced,
                },
                incomeStatement: {
                    totalPendapatan: incomeStatement.pendapatan.total,
                    totalBeban: incomeStatement.beban.total,
                    labaBersih: incomeStatement.labaBersih,
                },
                cashFlow: {
                    openingBalance: cashFlow.openingBalance,
                    netCashFlow: cashFlow.netCashFlow,
                    closingBalance: cashFlow.closingBalance,
                },
            };
        }
        catch (error) {
            logger_1.default.error('Get financial summary error:', error);
            throw error;
        }
    }
    /**
     * Helper: Group journal details by account
     */
    groupByAccount(details) {
        const grouped = details.reduce((acc, detail) => {
            const key = detail.akun.id;
            if (!acc[key]) {
                acc[key] = {
                    kodeAkun: detail.akun.kodeAkun,
                    namaAkun: detail.akun.namaAkun,
                    debit: 0,
                    kredit: 0,
                };
            }
            acc[key].debit += detail.debit.toNumber();
            acc[key].kredit += detail.kredit.toNumber();
            return acc;
        }, {});
        return Object.values(grouped).map((item) => ({
            kodeAkun: item.kodeAkun,
            namaAkun: item.namaAkun,
            jumlah: item.kredit - item.debit, // Net amount for income accounts
        }));
    }
    /**
     * Get Subsidiary Ledger (Buku Pembantu)
     * Detailed ledger for specific types: AR, AP, Inventory, Fixed Assets
     */
    async getSubsidiaryLedger(filters, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser)
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            const perusahaanId = requestingUser.role === 'SUPERADMIN' ? filters.perusahaanId : requestingUser.perusahaanId;
            if (!perusahaanId)
                throw new auth_service_1.ValidationError('perusahaanId required');
            // Get periode
            const periode = await database_1.default.periodeAkuntansi.findUnique({
                where: { id: filters.periodeId },
            });
            if (!periode)
                throw new auth_service_1.ValidationError('Periode tidak ditemukan');
            const startDate = filters.startDate ? new Date(filters.startDate) : periode.tanggalMulai;
            const endDate = filters.endDate ? new Date(filters.endDate) : periode.tanggalAkhir;
            let ledgerData = [];
            let ledgerType = filters.ledgerType;
            switch (ledgerType) {
                case 'accounts_receivable':
                    // AR: Transactions with customers
                    const arTransactions = await database_1.default.transaksi.findMany({
                        where: {
                            perusahaanId,
                            tipe: 'PENJUALAN',
                            tanggal: { gte: startDate, lte: endDate },
                            ...(filters.entityId && { pelangganId: filters.entityId }),
                        },
                        include: {
                            pelanggan: true,
                        },
                        orderBy: { tanggal: 'asc' },
                    });
                    ledgerData = arTransactions.map((t) => ({
                        tanggal: t.tanggal,
                        referensi: t.nomorTransaksi,
                        pelanggan: t.pelanggan?.nama || 'N/A',
                        deskripsi: t.deskripsi,
                        debit: t.total.toNumber(),
                        kredit: 0,
                        saldo: t.total.toNumber(), // Simplified
                    }));
                    break;
                case 'accounts_payable':
                    // AP: Transactions with suppliers
                    const apTransactions = await database_1.default.transaksi.findMany({
                        where: {
                            perusahaanId,
                            tipe: 'PEMBELIAN',
                            tanggal: { gte: startDate, lte: endDate },
                            ...(filters.entityId && { pemasokId: filters.entityId }),
                        },
                        include: {
                            pemasok: true,
                        },
                        orderBy: { tanggal: 'asc' },
                    });
                    ledgerData = apTransactions.map((t) => ({
                        tanggal: t.tanggal,
                        referensi: t.nomorTransaksi,
                        pemasok: t.pemasok?.nama || 'N/A',
                        deskripsi: t.deskripsi,
                        debit: 0,
                        kredit: t.total.toNumber(),
                        saldo: t.total.toNumber(), // Simplified
                    }));
                    break;
                case 'inventory':
                    // Inventory movements
                    const inventoryMovements = await database_1.default.transaksiDetail.findMany({
                        where: {
                            transaksi: {
                                perusahaanId,
                                tanggal: { gte: startDate, lte: endDate },
                            },
                            ...(filters.entityId && { persediaanId: filters.entityId }),
                        },
                        include: {
                            transaksi: true,
                            persediaan: true,
                        },
                        orderBy: {
                            transaksi: { tanggal: 'asc' },
                        },
                    });
                    ledgerData = inventoryMovements.map((m) => ({
                        tanggal: m.transaksi.tanggal,
                        referensi: m.transaksi.nomorTransaksi,
                        item: m.persediaan?.namaPersediaan || 'N/A',
                        deskripsi: m.deskripsi,
                        kuantitasIn: m.transaksi.tipe === 'PEMBELIAN' ? m.kuantitas : 0,
                        kuantitasOut: m.transaksi.tipe === 'PENJUALAN' ? m.kuantitas : 0,
                        hargaSatuan: m.hargaSatuan.toNumber(),
                        total: m.subtotal.toNumber(),
                    }));
                    break;
                case 'fixed_asset':
                    // Fixed asset transactions
                    const assetTransactions = await database_1.default.asetTetap.findMany({
                        where: {
                            perusahaanId,
                            tanggalPerolehan: { gte: startDate, lte: endDate },
                            ...(filters.entityId && { id: filters.entityId }),
                        },
                        orderBy: { tanggalPerolehan: 'asc' },
                    });
                    ledgerData = assetTransactions.map((a) => ({
                        tanggal: a.tanggalPerolehan,
                        kodeAset: a.kodeAset,
                        namaAset: a.namaAset,
                        kategori: a.kategori,
                        nilaiPerolehan: a.nilaiPerolehan.toNumber(),
                        akumulasiPenyusutan: a.akumulasiPenyusutan.toNumber(),
                        nilaiBuku: a.nilaiBuku.toNumber(),
                        status: a.status,
                    }));
                    break;
            }
            logger_1.default.info(`Subsidiary Ledger (${ledgerType}) generated for company: ${perusahaanId}`);
            return {
                perusahaanId,
                periodeId: filters.periodeId,
                ledgerType,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                data: ledgerData,
                totalRecords: ledgerData.length,
            };
        }
        catch (error) {
            logger_1.default.error('Get subsidiary ledger error:', error);
            throw error;
        }
    }
}
exports.ReportService = ReportService;
exports.reportService = new ReportService();

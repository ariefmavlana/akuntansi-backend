import prisma from '@/config/database';
import logger from '@/utils/logger';
import { Prisma } from '@prisma/client';
import type {
    GetBalanceSheetInput,
    GetIncomeStatementInput,
    GetCashFlowInput,
    GetEquityChangesInput,
    GetFinancialSummaryInput,
} from '@/validators/report.validator';
import { AuthenticationError, ValidationError } from './auth.service';

/**
 * Report Service
 * Handles PSAK-compliant financial reports
 */
export class ReportService {
    /**
     * Get Balance Sheet (Neraca / Laporan Posisi Keuangan)
     * ASET = LIABILITAS + EKUITAS
     */
    async getBalanceSheet(filters: GetBalanceSheetInput, requestingUserId: string) {
        try {
            const requestingUser = await prisma.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser) throw new AuthenticationError('User tidak ditemukan');

            const perusahaanId =
                requestingUser.role === 'SUPERADMIN' ? filters.perusahaanId : requestingUser.perusahaanId;

            if (!perusahaanId) throw new ValidationError('perusahaanId required');

            // Get periode
            const periode = await prisma.periodeAkuntansi.findUnique({
                where: { id: filters.periodeId },
            });
            if (!periode) throw new ValidationError('Periode tidak ditemukan');

            // Build where clause
            const where: Prisma.ChartOfAccountsWhereInput = {
                perusahaanId,
            };

            // Get all accounts
            const accounts = await prisma.chartOfAccounts.findMany({
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

            logger.info(`Balance Sheet generated for company: ${perusahaanId}`);

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
        } catch (error) {
            logger.error('Get balance sheet error:', error);
            throw error;
        }
    }

    /**
     * Get Income Statement (Laporan Laba Rugi)
     * Laba/Rugi = PENDAPATAN - BEBAN
     */
    async getIncomeStatement(filters: GetIncomeStatementInput, requestingUserId: string) {
        try {
            const requestingUser = await prisma.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser) throw new AuthenticationError('User tidak ditemukan');

            const perusahaanId =
                requestingUser.role === 'SUPERADMIN' ? filters.perusahaanId : requestingUser.perusahaanId;

            if (!perusahaanId) throw new ValidationError('perusahaanId required');

            // Get periode
            const periode = await prisma.periodeAkuntansi.findUnique({
                where: { id: filters.periodeId },
            });
            if (!periode) throw new ValidationError('Periode tidak ditemukan');

            // Date range
            const startDate = filters.startDate ? new Date(filters.startDate) : periode.tanggalMulai;
            const endDate = filters.endDate ? new Date(filters.endDate) : periode.tanggalAkhir;

            // Get journal details for the period
            const journalDetails = await prisma.jurnalDetail.findMany({
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
            const totalPendapatan = pendapatan.reduce(
                (sum, d) => sum + d.kredit.toNumber() - d.debit.toNumber(),
                0
            );
            const totalBeban = beban.reduce(
                (sum, d) => sum + d.debit.toNumber() - d.kredit.toNumber(),
                0
            );

            const labaBersih = totalPendapatan - totalBeban;

            logger.info(`Income Statement generated for company: ${perusahaanId}`);

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
        } catch (error) {
            logger.error('Get income statement error:', error);
            throw error;
        }
    }

    /**
     * Get Cash Flow Statement (Laporan Arus Kas)
     * 3 sections: Operating, Investing, Financing
     */
    async getCashFlowStatement(filters: GetCashFlowInput, requestingUserId: string) {
        try {
            const requestingUser = await prisma.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser) throw new AuthenticationError('User tidak ditemukan');

            const perusahaanId =
                requestingUser.role === 'SUPERADMIN' ? filters.perusahaanId : requestingUser.perusahaanId;

            if (!perusahaanId) throw new ValidationError('perusahaanId required');

            // Get periode
            const periode = await prisma.periodeAkuntansi.findUnique({
                where: { id: filters.periodeId },
            });
            if (!periode) throw new ValidationError('Periode tidak ditemukan');

            const startDate = filters.startDate ? new Date(filters.startDate) : periode.tanggalMulai;
            const endDate = filters.endDate ? new Date(filters.endDate) : periode.tanggalAkhir;

            // Get cash accounts (Kas dan Bank)
            const cashAccounts = await prisma.chartOfAccounts.findMany({
                where: {
                    perusahaanId,
                    kodeAkun: {
                        startsWith: '1-1-1', // Kas dan Setara Kas
                    },
                },
            });

            const cashAccountIds = cashAccounts.map((a) => a.id);

            // Get cash movements
            const cashMovements = await prisma.jurnalDetail.findMany({
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
            const openingBalance = cashAccounts.reduce(
                (sum, a) => sum + (a.saldoAwal?.toNumber() || 0),
                0
            );
            const closingBalance = cashAccounts.reduce(
                (sum, a) => sum + a.saldoBerjalan.toNumber(),
                0
            );

            logger.info(`Cash Flow Statement generated for company: ${perusahaanId}`);

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
        } catch (error) {
            logger.error('Get cash flow statement error:', error);
            throw error;
        }
    }

    /**
     * Get Changes in Equity (Laporan Perubahan Ekuitas)
     */
    async getEquityChanges(filters: GetEquityChangesInput, requestingUserId: string) {
        try {
            const requestingUser = await prisma.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser) throw new AuthenticationError('User tidak ditemukan');

            const perusahaanId =
                requestingUser.role === 'SUPERADMIN' ? filters.perusahaanId : requestingUser.perusahaanId;

            if (!perusahaanId) throw new ValidationError('perusahaanId required');

            // Get periode
            const periode = await prisma.periodeAkuntansi.findUnique({
                where: { id: filters.periodeId },
            });
            if (!periode) throw new ValidationError('Periode tidak ditemukan');

            const startDate = filters.startDate ? new Date(filters.startDate) : periode.tanggalMulai;
            const endDate = filters.endDate ? new Date(filters.endDate) : periode.tanggalAkhir;

            // Get equity accounts
            const equityAccounts = await prisma.chartOfAccounts.findMany({
                where: {
                    perusahaanId,
                    tipe: 'EKUITAS',
                },
                orderBy: { kodeAkun: 'asc' },
            });

            // Get equity movements
            const equityMovements = await prisma.jurnalDetail.findMany({
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
            const openingEquity = equityAccounts.reduce(
                (sum, a) => sum + (a.saldoAwal?.toNumber() || 0),
                0
            );
            const closingEquity = equityAccounts.reduce(
                (sum, a) => sum + a.saldoBerjalan.toNumber(),
                0
            );

            const equityIncrease = equityMovements.reduce(
                (sum, m) => sum + m.kredit.toNumber(),
                0
            );
            const equityDecrease = equityMovements.reduce(
                (sum, m) => sum + m.debit.toNumber(),
                0
            );

            logger.info(`Equity Changes generated for company: ${perusahaanId}`);

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
        } catch (error) {
            logger.error('Get equity changes error:', error);
            throw error;
        }
    }

    /**
     * Get Financial Summary Dashboard
     */
    async getFinancialSummary(filters: GetFinancialSummaryInput, requestingUserId: string) {
        try {
            // Add required parameters with defaults
            const balanceSheetFilters = { ...filters };
            const incomeStatementFilters = { ...filters, comparative: 'none' as const };
            const cashFlowFilters = { ...filters, method: 'indirect' as const };

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
        } catch (error) {
            logger.error('Get financial summary error:', error);
            throw error;
        }
    }

    /**
     * Helper: Group journal details by account
     */
    private groupByAccount(details: any[]) {
        const grouped = details.reduce((acc: any, detail) => {
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

        return Object.values(grouped).map((item: any) => ({
            kodeAkun: item.kodeAkun,
            namaAkun: item.namaAkun,
            jumlah: item.kredit - item.debit, // Net amount for income accounts
        }));
    }

    /**
     * Get Subsidiary Ledger (Buku Pembantu)
     * Detailed ledger for specific types: AR, AP, Inventory, Fixed Assets
     */
    async getSubsidiaryLedger(
        filters: {
            periodeId: string;
            ledgerType: 'accounts_receivable' | 'accounts_payable' | 'inventory' | 'fixed_asset';
            entityId?: string;
            perusahaanId?: string;
            startDate?: string;
            endDate?: string;
        },
        requestingUserId: string
    ) {
        try {
            const requestingUser = await prisma.pengguna.findUnique({ where: { id: requestingUserId } });
            if (!requestingUser) throw new AuthenticationError('User tidak ditemukan');

            const perusahaanId =
                requestingUser.role === 'SUPERADMIN' ? filters.perusahaanId : requestingUser.perusahaanId;

            if (!perusahaanId) throw new ValidationError('perusahaanId required');

            // Get periode
            const periode = await prisma.periodeAkuntansi.findUnique({
                where: { id: filters.periodeId },
            });
            if (!periode) throw new ValidationError('Periode tidak ditemukan');

            const startDate = filters.startDate ? new Date(filters.startDate) : periode.tanggalMulai;
            const endDate = filters.endDate ? new Date(filters.endDate) : periode.tanggalAkhir;

            let ledgerData: any[] = [];
            let ledgerType = filters.ledgerType;

            switch (ledgerType) {
                case 'accounts_receivable':
                    // AR: Transactions with customers
                    const arTransactions = await prisma.transaksi.findMany({
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
                    const apTransactions = await prisma.transaksi.findMany({
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
                    const inventoryMovements = await prisma.transaksiDetail.findMany({
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
                    const assetTransactions = await prisma.asetTetap.findMany({
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

            logger.info(`Subsidiary Ledger (${ledgerType}) generated for company: ${perusahaanId}`);

            return {
                perusahaanId,
                periodeId: filters.periodeId,
                ledgerType,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                data: ledgerData,
                totalRecords: ledgerData.length,
            };
        } catch (error) {
            logger.error('Get subsidiary ledger error:', error);
            throw error;
        }
    }
}

export const reportService = new ReportService();

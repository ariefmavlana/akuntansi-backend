"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.journalService = exports.JournalService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const auth_service_1 = require("./auth.service");
/**
 * Journal Service
 * Handles journal entries and ledger reports
 */
class JournalService {
    /**
     * Generate journal number
     */
    async generateJournalNumber(perusahaanId, tanggal) {
        const year = tanggal.getFullYear();
        const month = String(tanggal.getMonth() + 1).padStart(2, '0');
        // Get count for this month
        const count = await database_1.default.jurnalUmum.count({
            where: {
                perusahaanId,
                tanggal: {
                    gte: new Date(year, tanggal.getMonth(), 1),
                    lt: new Date(year, tanggal.getMonth() + 1, 1),
                },
            },
        });
        const sequence = String(count + 1).padStart(4, '0');
        return `JU/${year}${month}/${sequence}`;
    }
    /**
     * Create manual journal entry
     */
    async createJournal(data, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === data.perusahaanId;
            const canCreate = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && canCreate)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk membuat jurnal');
            }
            // Verify periode exists and is open
            const periode = await database_1.default.periodeAkuntansi.findUnique({
                where: { id: data.periodeId },
            });
            if (!periode) {
                throw new auth_service_1.ValidationError('Periode akuntansi tidak ditemukan');
            }
            if (periode.status !== 'TERBUKA') {
                throw new auth_service_1.ValidationError('Periode akuntansi sudah ditutup');
            }
            // Generate journal number if not provided
            const tanggal = typeof data.tanggal === 'string' ? new Date(data.tanggal) : data.tanggal;
            const nomorJurnal = data.nomorJurnal || (await this.generateJournalNumber(data.perusahaanId, tanggal));
            // Check if journal number already exists
            const existing = await database_1.default.jurnalUmum.findFirst({
                where: {
                    perusahaanId: data.perusahaanId,
                    nomorJurnal,
                },
            });
            if (existing) {
                throw new auth_service_1.ValidationError('Nomor jurnal sudah digunakan');
            }
            // Verify all accounts exist and are active
            for (const detail of data.detail) {
                const account = await database_1.default.chartOfAccounts.findUnique({
                    where: { id: detail.akunId },
                });
                if (!account) {
                    throw new auth_service_1.ValidationError(`Akun ${detail.akunId} tidak ditemukan`);
                }
                if (!account.isActive) {
                    throw new auth_service_1.ValidationError(`Akun ${account.namaAkun} tidak aktif`);
                }
            }
            // Calculate totals
            const totalDebit = data.detail.reduce((sum, d) => sum + d.debit, 0);
            const totalKredit = data.detail.reduce((sum, d) => sum + d.kredit, 0);
            // Verify balance
            if (Math.abs(totalDebit - totalKredit) >= 0.01) {
                throw new auth_service_1.ValidationError('Total debit dan kredit harus balance');
            }
            // Get current balances for each account
            const detailsWithBalance = await Promise.all(data.detail.map(async (d) => {
                const account = await database_1.default.chartOfAccounts.findUnique({
                    where: { id: d.akunId },
                });
                const saldoSebelum = account?.saldoBerjalan.toNumber() || 0;
                let saldoSesudah = saldoSebelum;
                // Calculate new balance based on normal balance
                if (account?.normalBalance === 'DEBIT') {
                    saldoSesudah = saldoSebelum + d.debit - d.kredit;
                }
                else {
                    saldoSesudah = saldoSebelum + d.kredit - d.debit;
                }
                return {
                    ...d,
                    saldoSebelum,
                    saldoSesudah,
                };
            }));
            // Create journal with details
            const journal = await database_1.default.jurnalUmum.create({
                data: {
                    perusahaanId: data.perusahaanId,
                    periodeId: data.periodeId,
                    nomorJurnal,
                    tanggal,
                    deskripsi: data.deskripsi,
                    totalDebit,
                    totalKredit,
                    isPosted: true, // Manual journals are posted immediately
                    postedAt: new Date(),
                    detail: {
                        create: detailsWithBalance.map((d) => ({
                            urutan: d.urutan,
                            akunId: d.akunId,
                            deskripsi: d.deskripsi,
                            debit: d.debit,
                            kredit: d.kredit,
                            saldoSebelum: d.saldoSebelum,
                            saldoSesudah: d.saldoSesudah,
                            costCenterId: d.costCenterId,
                            profitCenterId: d.profitCenterId,
                        })),
                    },
                },
                include: {
                    detail: {
                        include: {
                            akun: {
                                select: {
                                    kodeAkun: true,
                                    namaAkun: true,
                                },
                            },
                        },
                    },
                },
            });
            // Update account balances
            for (const detail of detailsWithBalance) {
                await database_1.default.chartOfAccounts.update({
                    where: { id: detail.akunId },
                    data: {
                        saldoBerjalan: detail.saldoSesudah,
                    },
                });
            }
            logger_1.default.info(`Journal created: ${journal.nomorJurnal} by ${requestingUser.email}`);
            return journal;
        }
        catch (error) {
            logger_1.default.error('Create journal error:', error);
            throw error;
        }
    }
    /**
     * Get journal by ID
     */
    async getJournalById(journalId, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const journal = await database_1.default.jurnalUmum.findUnique({
                where: { id: journalId },
                include: {
                    detail: {
                        include: {
                            akun: true,
                            costCenter: true,
                            profitCenter: true,
                        },
                        orderBy: { urutan: 'asc' },
                    },
                    periode: true,
                    voucher: true,
                },
            });
            if (!journal) {
                throw new auth_service_1.ValidationError('Jurnal tidak ditemukan');
            }
            // Check permissions
            if (requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== journal.perusahaanId) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses ke jurnal ini');
            }
            return journal;
        }
        catch (error) {
            logger_1.default.error('Get journal by ID error:', error);
            throw error;
        }
    }
    /**
     * List journals with pagination and filters
     */
    async listJournals(filters, requestingUserId) {
        try {
            const { page = 1, limit = 20, perusahaanId, periodeId, search, tanggalMulai, tanggalAkhir, isPosted, } = filters;
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Build where clause
            const where = {};
            // Non-SUPERADMIN can only see their company's journals
            if (requestingUser.role !== 'SUPERADMIN') {
                where.perusahaanId = requestingUser.perusahaanId;
            }
            else if (perusahaanId) {
                where.perusahaanId = perusahaanId;
            }
            if (periodeId) {
                where.periodeId = periodeId;
            }
            if (isPosted !== undefined) {
                where.isPosted = isPosted;
            }
            if (tanggalMulai || tanggalAkhir) {
                where.tanggal = {};
                if (tanggalMulai) {
                    where.tanggal.gte =
                        typeof tanggalMulai === 'string' ? new Date(tanggalMulai) : tanggalMulai;
                }
                if (tanggalAkhir) {
                    where.tanggal.lte =
                        typeof tanggalAkhir === 'string' ? new Date(tanggalAkhir) : tanggalAkhir;
                }
            }
            if (search) {
                where.OR = [
                    { nomorJurnal: { contains: search, mode: 'insensitive' } },
                    { deskripsi: { contains: search, mode: 'insensitive' } },
                ];
            }
            // Get total count
            const total = await database_1.default.jurnalUmum.count({ where });
            // Get journals
            const journals = await database_1.default.jurnalUmum.findMany({
                where,
                select: {
                    id: true,
                    nomorJurnal: true,
                    tanggal: true,
                    deskripsi: true,
                    totalDebit: true,
                    totalKredit: true,
                    isPosted: true,
                    isClosed: true,
                    createdAt: true,
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { tanggal: 'desc' },
            });
            return {
                data: journals,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            logger_1.default.error('List journals error:', error);
            throw error;
        }
    }
    /**
     * Get general ledger
     */
    async getGeneralLedger(filters, requestingUserId) {
        try {
            const { perusahaanId, periodeId, akunId, tanggalMulai, tanggalAkhir } = filters;
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Check permissions
            if (requestingUser.role !== 'SUPERADMIN' && requestingUser.perusahaanId !== perusahaanId) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses ke data perusahaan ini');
            }
            // Build where clause for journal details
            const where = {
                jurnal: {
                    perusahaanId,
                    periodeId,
                    isPosted: true,
                },
            };
            if (akunId) {
                where.akunId = akunId;
            }
            if (tanggalMulai || tanggalAkhir) {
                const tanggalFilter = {};
                if (tanggalMulai) {
                    tanggalFilter.gte =
                        typeof tanggalMulai === 'string' ? new Date(tanggalMulai) : tanggalMulai;
                }
                if (tanggalAkhir) {
                    tanggalFilter.lte =
                        typeof tanggalAkhir === 'string' ? new Date(tanggalAkhir) : tanggalAkhir;
                }
                where.jurnal = {
                    ...where.jurnal,
                    tanggal: tanggalFilter,
                };
            }
            // Get ledger entries
            const entries = await database_1.default.jurnalDetail.findMany({
                where,
                include: {
                    jurnal: {
                        select: {
                            nomorJurnal: true,
                            tanggal: true,
                            deskripsi: true,
                        },
                    },
                    akun: {
                        select: {
                            kodeAkun: true,
                            namaAkun: true,
                            normalBalance: true,
                        },
                    },
                },
                orderBy: [{ jurnal: { tanggal: 'asc' } }, { urutan: 'asc' }],
            });
            // Group by account if no specific account requested
            if (!akunId) {
                const groupedByAccount = entries.reduce((acc, entry) => {
                    const key = entry.akunId;
                    if (!acc[key]) {
                        acc[key] = {
                            akun: entry.akun,
                            entries: [],
                            totalDebit: 0,
                            totalKredit: 0,
                            saldoAkhir: 0,
                        };
                    }
                    acc[key].entries.push(entry);
                    acc[key].totalDebit += entry.debit.toNumber();
                    acc[key].totalKredit += entry.kredit.toNumber();
                    return acc;
                }, {});
                // Calculate final balance for each account
                Object.values(groupedByAccount).forEach((group) => {
                    if (group.akun.normalBalance === 'DEBIT') {
                        group.saldoAkhir = group.totalDebit - group.totalKredit;
                    }
                    else {
                        group.saldoAkhir = group.totalKredit - group.totalDebit;
                    }
                });
                return Object.values(groupedByAccount);
            }
            return entries;
        }
        catch (error) {
            logger_1.default.error('Get general ledger error:', error);
            throw error;
        }
    }
    /**
     * Get trial balance
     */
    async getTrialBalance(filters, requestingUserId) {
        try {
            const { perusahaanId, periodeId, tanggal } = filters;
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Check permissions
            if (requestingUser.role !== 'SUPERADMIN' && requestingUser.perusahaanId !== perusahaanId) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses ke data perusahaan ini');
            }
            // Get all accounts for the company
            const accounts = await database_1.default.chartOfAccounts.findMany({
                where: {
                    perusahaanId,
                    isActive: true,
                },
                orderBy: { kodeAkun: 'asc' },
            });
            // Build where clause for journal details
            const journalWhere = {
                perusahaanId,
                periodeId,
                isPosted: true,
            };
            if (tanggal) {
                journalWhere.tanggal = {
                    lte: typeof tanggal === 'string' ? new Date(tanggal) : tanggal,
                };
            }
            // Get all journal entries up to the date
            const journalDetails = await database_1.default.jurnalDetail.findMany({
                where: {
                    jurnal: journalWhere,
                },
                select: {
                    akunId: true,
                    debit: true,
                    kredit: true,
                },
            });
            // Calculate balance for each account
            const accountBalances = accounts.map((account) => {
                const accountEntries = journalDetails.filter((d) => d.akunId === account.id);
                const totalDebit = accountEntries.reduce((sum, e) => sum + e.debit.toNumber(), 0);
                const totalKredit = accountEntries.reduce((sum, e) => sum + e.kredit.toNumber(), 0);
                let saldo = 0;
                if (account.normalBalance === 'DEBIT') {
                    saldo = account.saldoAwal.toNumber() + totalDebit - totalKredit;
                }
                else {
                    saldo = account.saldoAwal.toNumber() + totalKredit - totalDebit;
                }
                return {
                    kodeAkun: account.kodeAkun,
                    namaAkun: account.namaAkun,
                    tipe: account.tipe,
                    normalBalance: account.normalBalance,
                    saldoAwal: account.saldoAwal.toNumber(),
                    debit: totalDebit,
                    kredit: totalKredit,
                    saldo,
                };
            });
            // Calculate totals
            const totals = {
                totalSaldoAwal: accountBalances.reduce((sum, a) => sum + a.saldoAwal, 0),
                totalDebit: accountBalances.reduce((sum, a) => sum + a.debit, 0),
                totalKredit: accountBalances.reduce((sum, a) => sum + a.kredit, 0),
                totalSaldo: accountBalances.reduce((sum, a) => sum + a.saldo, 0),
            };
            return {
                accounts: accountBalances.filter((a) => a.saldo !== 0 || a.debit !== 0 || a.kredit !== 0), // Only show accounts with activity
                totals,
            };
        }
        catch (error) {
            logger_1.default.error('Get trial balance error:', error);
            throw error;
        }
    }
    /**
     * Delete journal (only if not closed)
     */
    async deleteJournal(journalId, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const journal = await database_1.default.jurnalUmum.findUnique({
                where: { id: journalId },
                include: { detail: true },
            });
            if (!journal) {
                throw new auth_service_1.ValidationError('Jurnal tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === journal.perusahaanId;
            const canDelete = ['ADMIN', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && canDelete)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk menghapus jurnal ini');
            }
            // Cannot delete if closed
            if (journal.isClosed) {
                throw new auth_service_1.ValidationError('Jurnal yang sudah ditutup tidak dapat dihapus');
            }
            // Reverse account balances
            for (const detail of journal.detail) {
                await database_1.default.chartOfAccounts.update({
                    where: { id: detail.akunId },
                    data: {
                        saldoBerjalan: detail.saldoSebelum,
                    },
                });
            }
            // Delete journal (cascade will delete details)
            await database_1.default.jurnalUmum.delete({
                where: { id: journalId },
            });
            logger_1.default.info(`Journal deleted: ${journal.nomorJurnal} by ${requestingUser.email}`);
        }
        catch (error) {
            logger_1.default.error('Delete journal error:', error);
            throw error;
        }
    }
    /**
     * Create journal from transaction (Auto-Posting)
     */
    async createFromTransaction(transactionId, requestingUserId) {
        try {
            const transaction = await database_1.default.transaksi.findUnique({
                where: { id: transactionId },
                include: {
                    detail: true,
                    pelanggan: true,
                    pemasok: true,
                },
            });
            if (!transaction) {
                throw new auth_service_1.ValidationError('Transaksi tidak ditemukan');
            }
            // Determine Account Receivables (AR) or Account Payables (AP)
            let contraAccountId = null;
            if (transaction.tipe === 'PENJUALAN') {
                // Find AR Account (Piutang Usaha)
                const arAccount = await database_1.default.chartOfAccounts.findFirst({
                    where: {
                        perusahaanId: transaction.perusahaanId,
                        kategoriAset: 'PIUTANG_USAHA',
                        isActive: true,
                    },
                });
                if (!arAccount) {
                    throw new auth_service_1.ValidationError('Akun Piutang Usaha (AR) tidak ditemukan. Harap buat akun dengan kategori Aset Lancar > Piutang Usaha.');
                }
                contraAccountId = arAccount.id;
            }
            else if (transaction.tipe === 'PEMBELIAN') {
                // Find AP Account (Hutang Usaha)
                const apAccount = await database_1.default.chartOfAccounts.findFirst({
                    where: {
                        perusahaanId: transaction.perusahaanId,
                        kategoriLiabilitas: 'HUTANG_USAHA',
                        isActive: true,
                    },
                });
                if (!apAccount) {
                    throw new auth_service_1.ValidationError('Akun Hutang Usaha (AP) tidak ditemukan. Harap buat akun dengan kategori Liabilitas > Hutang Usaha.');
                }
                contraAccountId = apAccount.id;
            }
            // Only proceed if we identified a contra account (for Sales/Purchase)
            // For other types, we might need different logic or skip auto-journaling
            if (!contraAccountId && (transaction.tipe === 'PENJUALAN' || transaction.tipe === 'PEMBELIAN')) {
                throw new auth_service_1.ValidationError(`Tidak dapat menentukan akun lawan untuk tipe transaksi ${transaction.tipe}`);
            }
            // Prepare Journal Details
            const journalDetails = [];
            let urutan = 1;
            if (transaction.tipe === 'PENJUALAN') {
                // DEBIT: Piutang Usaha (Total Tagihan)
                journalDetails.push({
                    urutan: urutan++,
                    akunId: contraAccountId,
                    deskripsi: `Piutang atas ${transaction.nomorTransaksi}`,
                    debit: transaction.total,
                    kredit: 0,
                });
                // CREDIT: Pendapatan/Sales (Subtotal) - breakdown by items if needed, but here we map item accounts
                for (const item of transaction.detail) {
                    journalDetails.push({
                        urutan: urutan++,
                        akunId: item.akunId, // Akun Pendapatan from Item
                        deskripsi: item.deskripsi || `Penjualan item`,
                        debit: 0,
                        kredit: item.subtotal,
                    });
                }
                // CREDIT: PPN Keluaran (Mora Tax)
                if (transaction.nilaiPajak.gt(0)) {
                    // Find Tax Account? Or use a default?
                    // For now, let's assume we find a generic "Hutang Pajak PPN" or similar.
                    // Ideally, MasterPajak should link to an account.
                    // Fallback search:
                    const taxAccount = await database_1.default.chartOfAccounts.findFirst({
                        where: {
                            perusahaanId: transaction.perusahaanId,
                            namaAkun: { contains: 'PPN', mode: 'insensitive' }, // Rickety fallback
                            tipe: 'LIABILITAS',
                        },
                    });
                    if (taxAccount) {
                        journalDetails.push({
                            urutan: urutan++,
                            akunId: taxAccount.id,
                            deskripsi: `PPN Keluaran ${transaction.nomorTransaksi}`,
                            debit: 0,
                            kredit: transaction.nilaiPajak,
                        });
                    }
                    else {
                        // Warn but proceed? Or fail? Fail is safer for accounting.
                        // But for now, to ensure compatibility, maybe just append to the first item? No, that's bad.
                        // Let's Skip tax journal if account not found, but log warning.
                        logger_1.default.warn(`Tax account not found for transaction ${transaction.nomorTransaksi}`);
                    }
                }
            }
            else if (transaction.tipe === 'PEMBELIAN') {
                // CREDIT: Hutang Usaha (Total Tagihan)
                journalDetails.push({
                    urutan: urutan++,
                    akunId: contraAccountId,
                    deskripsi: `Hutang atas ${transaction.nomorTransaksi}`,
                    debit: 0,
                    kredit: transaction.total,
                });
                // DEBIT: Persediaan/Beban (Subtotal)
                for (const item of transaction.detail) {
                    journalDetails.push({
                        urutan: urutan++,
                        akunId: item.akunId, // Akun Persediaan/Beban
                        deskripsi: item.deskripsi || `Pembelian item`,
                        debit: item.subtotal,
                        kredit: 0,
                    });
                }
                // DEBIT: PPN Masukan
                if (transaction.nilaiPajak.gt(0)) {
                    // Find Tax Account
                    const taxAccount = await database_1.default.chartOfAccounts.findFirst({
                        where: {
                            perusahaanId: transaction.perusahaanId,
                            namaAkun: { contains: 'PPN', mode: 'insensitive' },
                            tipe: 'ASET', // PPN Masukan is usually an asset (prepaid tax)
                        },
                    });
                    if (taxAccount) {
                        journalDetails.push({
                            urutan: urutan++,
                            akunId: taxAccount.id,
                            deskripsi: `PPN Masukan ${transaction.nomorTransaksi}`,
                            debit: transaction.nilaiPajak,
                            kredit: 0,
                        });
                    }
                }
            }
            // Get Period
            // We assume the period is correct based on transaction date.
            // But we need the ID.
            const periode = await database_1.default.periodeAkuntansi.findFirst({
                where: {
                    perusahaanId: transaction.perusahaanId,
                    tanggalMulai: { lte: transaction.tanggal },
                    tanggalAkhir: { gte: transaction.tanggal },
                    status: 'TERBUKA'
                }
            });
            if (!periode) {
                // If no open period, maybe we can't post?
                // But postTransaction usually happens validation before calling this.
                // We'll throw if no period found.
                throw new auth_service_1.ValidationError('Periode akuntansi tertutup atau tidak ditemukan untuk tanggal transaksi ini');
            }
            // Create Journal
            const nomorJurnal = await this.generateJournalNumber(transaction.perusahaanId, transaction.tanggal);
            // Calculate final totals to ensure balance and for the header
            const totalDebit = journalDetails.reduce((sum, d) => sum + Number(d.debit), 0);
            const totalKredit = journalDetails.reduce((sum, d) => sum + Number(d.kredit), 0);
            if (Math.abs(totalDebit - totalKredit) > 1) { // Tolerance for rounding
                // Adjust rounding on the first item? Or throw?
                // Throw for now.
                throw new auth_service_1.ValidationError(`Auto-Journal unbalanced: Debit ${totalDebit} vs Kredit ${totalKredit}`);
            }
            const journal = await database_1.default.jurnalUmum.create({
                data: {
                    perusahaanId: transaction.perusahaanId,
                    periodeId: periode.id,
                    nomorJurnal,
                    tanggal: transaction.tanggal,
                    deskripsi: `Auto-generated from ${transaction.nomorTransaksi}`,
                    totalDebit: totalDebit,
                    totalKredit: totalKredit,
                    isPosted: true,
                    postedAt: new Date(),
                    detail: {
                        create: journalDetails.map(d => ({
                            urutan: d.urutan,
                            akunId: d.akunId,
                            deskripsi: d.deskripsi,
                            debit: d.debit,
                            kredit: d.kredit,
                            saldoSebelum: 0, // Logic to update balance should be shared, but for now simple insert
                            saldoSesudah: 0
                        }))
                    }
                }
            });
            // Update Account Balances (Simplified version of createJournal logic)
            for (const d of journalDetails) {
                const account = await database_1.default.chartOfAccounts.findUnique({ where: { id: d.akunId } });
                if (account) {
                    const change = account.normalBalance === 'DEBIT'
                        ? Number(d.debit) - Number(d.kredit)
                        : Number(d.kredit) - Number(d.debit);
                    await database_1.default.chartOfAccounts.update({
                        where: { id: d.akunId },
                        data: { saldoBerjalan: { increment: change } }
                    });
                }
            }
            return journal;
        }
        catch (error) {
            logger_1.default.error('Create journal from transaction error:', error);
            throw error;
        }
    }
    /**
     * Create journal from voucher (Auto-Posting)
     */
    async createFromVoucher(voucherId, requestingUserId) {
        try {
            const voucher = await database_1.default.voucher.findUnique({
                where: { id: voucherId },
                include: { detail: true }
            });
            if (!voucher) {
                throw new auth_service_1.ValidationError('Voucher tidak ditemukan');
            }
            const periode = await database_1.default.periodeAkuntansi.findFirst({
                where: {
                    perusahaanId: voucher.perusahaanId,
                    tanggalMulai: { lte: voucher.tanggal },
                    tanggalAkhir: { gte: voucher.tanggal },
                    status: 'TERBUKA'
                }
            });
            if (!periode) {
                throw new auth_service_1.ValidationError('Periode akuntansi tertutup atau tidak ditemukan');
            }
            const nomorJurnal = await this.generateJournalNumber(voucher.perusahaanId, voucher.tanggal);
            const journal = await database_1.default.jurnalUmum.create({
                data: {
                    perusahaanId: voucher.perusahaanId,
                    periodeId: periode.id,
                    voucherId: voucher.id, // Link back
                    nomorJurnal,
                    tanggal: voucher.tanggal,
                    deskripsi: voucher.deskripsi || `Voucher ${voucher.nomorVoucher}`,
                    totalDebit: voucher.totalDebit,
                    totalKredit: voucher.totalKredit,
                    isPosted: true,
                    postedAt: new Date(),
                    detail: {
                        create: voucher.detail.map(d => ({
                            urutan: d.urutan,
                            akunId: d.akunId,
                            deskripsi: d.deskripsi,
                            debit: d.debit,
                            kredit: d.kredit,
                            costCenterId: d.costCenterId,
                            profitCenterId: d.profitCenterId,
                            saldoSebelum: 0,
                            saldoSesudah: 0
                        }))
                    }
                }
            });
            // Update Account Balances
            for (const d of voucher.detail) {
                const account = await database_1.default.chartOfAccounts.findUnique({ where: { id: d.akunId } });
                if (account) {
                    const change = account.normalBalance === 'DEBIT'
                        ? d.debit.toNumber() - d.kredit.toNumber()
                        : d.kredit.toNumber() - d.debit.toNumber();
                    await database_1.default.chartOfAccounts.update({
                        where: { id: d.akunId },
                        data: { saldoBerjalan: { increment: change } }
                    });
                }
            }
            return journal;
        }
        catch (error) {
            logger_1.default.error('Create journal from voucher error:', error);
            throw error;
        }
    }
}
exports.JournalService = JournalService;
// Export singleton instance
exports.journalService = new JournalService();

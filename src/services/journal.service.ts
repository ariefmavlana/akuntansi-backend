import prisma from '@/config/database';
import logger from '@/utils/logger';
import { JurnalUmum, Prisma } from '@prisma/client';
import type {
    CreateJournalInput,
    ListJournalsInput,
    GetGeneralLedgerInput,
    GetTrialBalanceInput,
} from '@/validators/journal.validator';
import { AuthenticationError, ValidationError } from './auth.service';

/**
 * Journal Service
 * Handles journal entries and ledger reports
 */
export class JournalService {
    /**
     * Generate journal number
     */
    private async generateJournalNumber(
        perusahaanId: string,
        tanggal: Date
    ): Promise<string> {
        const year = tanggal.getFullYear();
        const month = String(tanggal.getMonth() + 1).padStart(2, '0');

        // Get count for this month
        const count = await prisma.jurnalUmum.count({
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
    async createJournal(data: CreateJournalInput, requestingUserId: string): Promise<JurnalUmum> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === data.perusahaanId;
            const canCreate = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(
                requestingUser.role
            );

            if (!isSuperAdmin && !(isOwnCompany && canCreate)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk membuat jurnal');
            }

            // Verify periode exists and is open
            const periode = await prisma.periodeAkuntansi.findUnique({
                where: { id: data.periodeId },
            });

            if (!periode) {
                throw new ValidationError('Periode akuntansi tidak ditemukan');
            }

            if (periode.status !== 'TERBUKA') {
                throw new ValidationError('Periode akuntansi sudah ditutup');
            }

            // Generate journal number if not provided
            const tanggal = typeof data.tanggal === 'string' ? new Date(data.tanggal) : data.tanggal;
            const nomorJurnal =
                data.nomorJurnal || (await this.generateJournalNumber(data.perusahaanId, tanggal));

            // Check if journal number already exists
            const existing = await prisma.jurnalUmum.findFirst({
                where: {
                    perusahaanId: data.perusahaanId,
                    nomorJurnal,
                },
            });

            if (existing) {
                throw new ValidationError('Nomor jurnal sudah digunakan');
            }

            // Verify all accounts exist and are active
            for (const detail of data.detail) {
                const account = await prisma.chartOfAccounts.findUnique({
                    where: { id: detail.akunId },
                });

                if (!account) {
                    throw new ValidationError(`Akun ${detail.akunId} tidak ditemukan`);
                }

                if (!account.isActive) {
                    throw new ValidationError(`Akun ${account.namaAkun} tidak aktif`);
                }
            }

            // Calculate totals
            const totalDebit = data.detail.reduce((sum, d) => sum + d.debit, 0);
            const totalKredit = data.detail.reduce((sum, d) => sum + d.kredit, 0);

            // Verify balance
            if (Math.abs(totalDebit - totalKredit) >= 0.01) {
                throw new ValidationError('Total debit dan kredit harus balance');
            }

            // Get current balances for each account
            const detailsWithBalance = await Promise.all(
                data.detail.map(async (d) => {
                    const account = await prisma.chartOfAccounts.findUnique({
                        where: { id: d.akunId },
                    });

                    const saldoSebelum = account?.saldoBerjalan.toNumber() || 0;
                    let saldoSesudah = saldoSebelum;

                    // Calculate new balance based on normal balance
                    if (account?.normalBalance === 'DEBIT') {
                        saldoSesudah = saldoSebelum + d.debit - d.kredit;
                    } else {
                        saldoSesudah = saldoSebelum + d.kredit - d.debit;
                    }

                    return {
                        ...d,
                        saldoSebelum,
                        saldoSesudah,
                    };
                })
            );

            // Create journal with details
            const journal = await prisma.jurnalUmum.create({
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
                await prisma.chartOfAccounts.update({
                    where: { id: detail.akunId },
                    data: {
                        saldoBerjalan: detail.saldoSesudah,
                    },
                });
            }

            logger.info(`Journal created: ${journal.nomorJurnal} by ${requestingUser.email}`);

            return journal;
        } catch (error) {
            logger.error('Create journal error:', error);
            throw error;
        }
    }

    /**
     * Get journal by ID
     */
    async getJournalById(journalId: string, requestingUserId: string): Promise<JurnalUmum> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const journal = await prisma.jurnalUmum.findUnique({
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
                throw new ValidationError('Jurnal tidak ditemukan');
            }

            // Check permissions
            if (
                requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== journal.perusahaanId
            ) {
                throw new AuthenticationError('Anda tidak memiliki akses ke jurnal ini');
            }

            return journal;
        } catch (error) {
            logger.error('Get journal by ID error:', error);
            throw error;
        }
    }

    /**
     * List journals with pagination and filters
     */
    async listJournals(filters: ListJournalsInput, requestingUserId: string) {
        try {
            const {
                page = 1,
                limit = 20,
                perusahaanId,
                periodeId,
                search,
                tanggalMulai,
                tanggalAkhir,
                isPosted,
            } = filters;

            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Build where clause
            const where: Prisma.JurnalUmumWhereInput = {};

            // Non-SUPERADMIN can only see their company's journals
            if (requestingUser.role !== 'SUPERADMIN') {
                where.perusahaanId = requestingUser.perusahaanId;
            } else if (perusahaanId) {
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
            const total = await prisma.jurnalUmum.count({ where });

            // Get journals
            const journals = await prisma.jurnalUmum.findMany({
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
        } catch (error) {
            logger.error('List journals error:', error);
            throw error;
        }
    }

    /**
     * Get general ledger
     */
    async getGeneralLedger(filters: GetGeneralLedgerInput, requestingUserId: string) {
        try {
            const { perusahaanId, periodeId, akunId, tanggalMulai, tanggalAkhir } = filters;

            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Check permissions
            if (requestingUser.role !== 'SUPERADMIN' && requestingUser.perusahaanId !== perusahaanId) {
                throw new AuthenticationError('Anda tidak memiliki akses ke data perusahaan ini');
            }

            // Build where clause for journal details
            const where: Prisma.JurnalDetailWhereInput = {
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
                const tanggalFilter: any = {};
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
            const entries = await prisma.jurnalDetail.findMany({
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
                }, {} as Record<string, any>);

                // Calculate final balance for each account
                Object.values(groupedByAccount).forEach((group: any) => {
                    if (group.akun.normalBalance === 'DEBIT') {
                        group.saldoAkhir = group.totalDebit - group.totalKredit;
                    } else {
                        group.saldoAkhir = group.totalKredit - group.totalDebit;
                    }
                });

                return Object.values(groupedByAccount);
            }

            return entries;
        } catch (error) {
            logger.error('Get general ledger error:', error);
            throw error;
        }
    }

    /**
     * Get trial balance
     */
    async getTrialBalance(filters: GetTrialBalanceInput, requestingUserId: string) {
        try {
            const { perusahaanId, periodeId, tanggal } = filters;

            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Check permissions
            if (requestingUser.role !== 'SUPERADMIN' && requestingUser.perusahaanId !== perusahaanId) {
                throw new AuthenticationError('Anda tidak memiliki akses ke data perusahaan ini');
            }

            // Get all accounts for the company
            const accounts = await prisma.chartOfAccounts.findMany({
                where: {
                    perusahaanId,
                    isActive: true,
                },
                orderBy: { kodeAkun: 'asc' },
            });

            // Build where clause for journal details
            const journalWhere: Prisma.JurnalUmumWhereInput = {
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
            const journalDetails = await prisma.jurnalDetail.findMany({
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
                } else {
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
        } catch (error) {
            logger.error('Get trial balance error:', error);
            throw error;
        }
    }

    /**
     * Delete journal (only if not closed)
     */
    async deleteJournal(journalId: string, requestingUserId: string): Promise<void> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const journal = await prisma.jurnalUmum.findUnique({
                where: { id: journalId },
                include: { detail: true },
            });

            if (!journal) {
                throw new ValidationError('Jurnal tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === journal.perusahaanId;
            const canDelete = ['ADMIN', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);

            if (!isSuperAdmin && !(isOwnCompany && canDelete)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk menghapus jurnal ini');
            }

            // Cannot delete if closed
            if (journal.isClosed) {
                throw new ValidationError('Jurnal yang sudah ditutup tidak dapat dihapus');
            }

            // Reverse account balances
            for (const detail of journal.detail) {
                await prisma.chartOfAccounts.update({
                    where: { id: detail.akunId },
                    data: {
                        saldoBerjalan: detail.saldoSebelum,
                    },
                });
            }

            // Delete journal (cascade will delete details)
            await prisma.jurnalUmum.delete({
                where: { id: journalId },
            });

            logger.info(`Journal deleted: ${journal.nomorJurnal} by ${requestingUser.email}`);
        } catch (error) {
            logger.error('Delete journal error:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const journalService = new JournalService();

import prisma from '@/config/database';
import logger from '@/utils/logger';
import { Voucher, StatusVoucher, Prisma } from '@prisma/client';
import type {
    CreateVoucherInput,
    UpdateVoucherInput,
    ListVouchersInput,
    ApproveVoucherInput,
    RejectVoucherInput,
    PostVoucherInput,
    ReverseVoucherInput,
} from '@/validators/voucher.validator';
import { AuthenticationError, ValidationError } from './auth.service';

/**
 * Voucher Service
 * Handles voucher management with approval workflow and journal posting
 */
export class VoucherService {
    /**
     * Generate voucher number
     */
    private async generateVoucherNumber(
        perusahaanId: string,
        tipe: string,
        tanggal: Date
    ): Promise<string> {
        const year = tanggal.getFullYear();
        const month = String(tanggal.getMonth() + 1).padStart(2, '0');

        // Get count for this month
        const count = await prisma.voucher.count({
            where: {
                perusahaanId,
                tipe: tipe as any,
                tanggal: {
                    gte: new Date(year, tanggal.getMonth(), 1),
                    lt: new Date(year, tanggal.getMonth() + 1, 1),
                },
            },
        });

        const sequence = String(count + 1).padStart(4, '0');
        return `${tipe.substring(0, 3).toUpperCase()}/${year}${month}/${sequence}`;
    }

    /**
     * Create voucher
     */
    async createVoucher(data: CreateVoucherInput, requestingUserId: string): Promise<Voucher> {
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
            const canCreate = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT', 'CASHIER'].includes(
                requestingUser.role
            );

            if (!isSuperAdmin && !(isOwnCompany && canCreate)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk membuat voucher');
            }

            // Generate voucher number if not provided
            const tanggal = typeof data.tanggal === 'string' ? new Date(data.tanggal) : data.tanggal;
            const nomorVoucher =
                data.nomorVoucher ||
                (await this.generateVoucherNumber(data.perusahaanId, data.tipe, tanggal));

            // Check if voucher number already exists
            const existing = await prisma.voucher.findFirst({
                where: {
                    perusahaanId: data.perusahaanId,
                    nomorVoucher,
                },
            });

            if (existing) {
                throw new ValidationError('Nomor voucher sudah digunakan');
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

            // Create voucher with details
            const voucher = await prisma.voucher.create({
                data: {
                    perusahaanId: data.perusahaanId,
                    nomorVoucher,
                    tanggal,
                    tipe: data.tipe,
                    transaksiId: data.transaksiId,
                    deskripsi: data.deskripsi,
                    totalDebit,
                    totalKredit,
                    status: StatusVoucher.DRAFT,
                    dibuatOlehId: requestingUserId,
                    catatan: data.catatan,
                    lampiran: data.lampiran,
                    detail: {
                        create: data.detail.map((d) => ({
                            urutan: d.urutan,
                            akunId: d.akunId,
                            deskripsi: d.deskripsi,
                            debit: d.debit,
                            kredit: d.kredit,
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

            logger.info(`Voucher created: ${voucher.nomorVoucher} by ${requestingUser.email}`);

            return voucher;
        } catch (error) {
            logger.error('Create voucher error:', error);
            throw error;
        }
    }

    /**
     * Get voucher by ID
     */
    async getVoucherById(voucherId: string, requestingUserId: string): Promise<Voucher> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const voucher = await prisma.voucher.findUnique({
                where: { id: voucherId },
                include: {
                    detail: {
                        include: {
                            akun: true,
                            costCenter: true,
                            profitCenter: true,
                        },
                        orderBy: { urutan: 'asc' },
                    },
                    transaksi: true,
                    dibuatOleh: {
                        select: {
                            id: true,
                            namaLengkap: true,
                            email: true,
                        },
                    },
                    approval: true,
                    jurnal: true,
                },
            });

            if (!voucher) {
                throw new ValidationError('Voucher tidak ditemukan');
            }

            // Check permissions
            if (
                requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== voucher.perusahaanId
            ) {
                throw new AuthenticationError('Anda tidak memiliki akses ke voucher ini');
            }

            return voucher;
        } catch (error) {
            logger.error('Get voucher by ID error:', error);
            throw error;
        }
    }

    /**
     * List vouchers with pagination and filters
     */
    async listVouchers(filters: ListVouchersInput, requestingUserId: string) {
        try {
            const {
                page = 1,
                limit = 20,
                perusahaanId,
                tipe,
                status,
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
            const where: Prisma.VoucherWhereInput = {};

            // Non-SUPERADMIN can only see their company's vouchers
            if (requestingUser.role !== 'SUPERADMIN') {
                where.perusahaanId = requestingUser.perusahaanId;
            } else if (perusahaanId) {
                where.perusahaanId = perusahaanId;
            }

            if (tipe) {
                where.tipe = tipe;
            }

            if (status) {
                where.status = status;
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
                    { nomorVoucher: { contains: search, mode: 'insensitive' } },
                    { deskripsi: { contains: search, mode: 'insensitive' } },
                ];
            }

            // Get total count
            const total = await prisma.voucher.count({ where });

            // Get vouchers
            const vouchers = await prisma.voucher.findMany({
                where,
                select: {
                    id: true,
                    nomorVoucher: true,
                    tanggal: true,
                    tipe: true,
                    deskripsi: true,
                    totalDebit: true,
                    totalKredit: true,
                    status: true,
                    isPosted: true,
                    isReversed: true,
                    dibuatOleh: {
                        select: {
                            namaLengkap: true,
                        },
                    },
                    createdAt: true,
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { tanggal: 'desc' },
            });

            return {
                data: vouchers,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('List vouchers error:', error);
            throw error;
        }
    }

    /**
     * Update voucher (only if DRAFT)
     */
    async updateVoucher(
        voucherId: string,
        data: UpdateVoucherInput['body'],
        requestingUserId: string
    ): Promise<Voucher> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const voucher = await prisma.voucher.findUnique({
                where: { id: voucherId },
            });

            if (!voucher) {
                throw new ValidationError('Voucher tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === voucher.perusahaanId;
            const canUpdate = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);

            if (!isSuperAdmin && !(isOwnCompany && canUpdate)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk mengupdate voucher ini');
            }

            // Can only update if DRAFT
            if (voucher.status !== StatusVoucher.DRAFT) {
                throw new ValidationError('Hanya voucher dengan status DRAFT yang dapat diubah');
            }

            // Update voucher
            const updateData: Prisma.VoucherUpdateInput = {};

            if (data.tanggal) {
                updateData.tanggal = typeof data.tanggal === 'string' ? new Date(data.tanggal) : data.tanggal;
            }

            if (data.deskripsi) {
                updateData.deskripsi = data.deskripsi;
            }

            if (data.catatan !== undefined) {
                updateData.catatan = data.catatan;
            }

            if (data.lampiran !== undefined) {
                updateData.lampiran = data.lampiran;
            }

            // If detail is provided, replace all details
            if (data.detail) {
                // Delete existing details
                await prisma.voucherDetail.deleteMany({
                    where: { voucherId },
                });

                // Calculate new totals
                const totalDebit = data.detail.reduce((sum, d) => sum + d.debit, 0);
                const totalKredit = data.detail.reduce((sum, d) => sum + d.kredit, 0);

                updateData.totalDebit = totalDebit;
                updateData.totalKredit = totalKredit;

                updateData.detail = {
                    create: data.detail.map((d) => ({
                        urutan: d.urutan,
                        akunId: d.akunId,
                        deskripsi: d.deskripsi,
                        debit: d.debit,
                        kredit: d.kredit,
                        costCenterId: d.costCenterId,
                        profitCenterId: d.profitCenterId,
                    })),
                };
            }

            const updatedVoucher = await prisma.voucher.update({
                where: { id: voucherId },
                data: updateData,
                include: {
                    detail: {
                        include: {
                            akun: true,
                        },
                    },
                },
            });

            logger.info(`Voucher updated: ${updatedVoucher.nomorVoucher} by ${requestingUser.email}`);

            return updatedVoucher;
        } catch (error) {
            logger.error('Update voucher error:', error);
            throw error;
        }
    }

    /**
     * Approve voucher
     */
    async approveVoucher(
        voucherId: string,
        data: ApproveVoucherInput['body'],
        requestingUserId: string
    ): Promise<Voucher> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const voucher = await prisma.voucher.findUnique({
                where: { id: voucherId },
            });

            if (!voucher) {
                throw new ValidationError('Voucher tidak ditemukan');
            }

            // Check permissions - only ADMIN, MANAGER, or higher can approve
            const canApprove = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CFO'].includes(requestingUser.role);

            if (!canApprove) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk menyetujui voucher');
            }

            // Can only approve if MENUNGGU_PERSETUJUAN
            if (voucher.status !== StatusVoucher.MENUNGGU_PERSETUJUAN) {
                throw new ValidationError('Hanya voucher dengan status MENUNGGU_PERSETUJUAN yang dapat disetujui');
            }

            // Update voucher status
            const approvedVoucher = await prisma.voucher.update({
                where: { id: voucherId },
                data: {
                    status: StatusVoucher.DISETUJUI,
                    disetujuiOleh: requestingUserId,
                    tanggalDisetujui: new Date(),
                },
            });

            logger.info(`Voucher approved: ${approvedVoucher.nomorVoucher} by ${requestingUser.email}`);

            return approvedVoucher;
        } catch (error) {
            logger.error('Approve voucher error:', error);
            throw error;
        }
    }

    /**
     * Reject voucher
     */
    async rejectVoucher(
        voucherId: string,
        data: RejectVoucherInput['body'],
        requestingUserId: string
    ): Promise<Voucher> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const voucher = await prisma.voucher.findUnique({
                where: { id: voucherId },
            });

            if (!voucher) {
                throw new ValidationError('Voucher tidak ditemukan');
            }

            // Check permissions
            const canReject = ['SUPERADMIN', 'ADMIN', 'MANAGER', 'CFO'].includes(requestingUser.role);

            if (!canReject) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk menolak voucher');
            }

            // Can only reject if MENUNGGU_PERSETUJUAN
            if (voucher.status !== StatusVoucher.MENUNGGU_PERSETUJUAN) {
                throw new ValidationError('Hanya voucher dengan status MENUNGGU_PERSETUJUAN yang dapat ditolak');
            }

            // Update voucher status
            const rejectedVoucher = await prisma.voucher.update({
                where: { id: voucherId },
                data: {
                    status: StatusVoucher.DITOLAK,
                    catatan: data.alasan,
                },
            });

            logger.info(`Voucher rejected: ${rejectedVoucher.nomorVoucher} by ${requestingUser.email}`);

            return rejectedVoucher;
        } catch (error) {
            logger.error('Reject voucher error:', error);
            throw error;
        }
    }

    /**
     * Post voucher to journal
     */
    async postVoucher(
        voucherId: string,
        data: PostVoucherInput['body'],
        requestingUserId: string
    ): Promise<Voucher> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const voucher = await prisma.voucher.findUnique({
                where: { id: voucherId },
                include: { detail: true },
            });

            if (!voucher) {
                throw new ValidationError('Voucher tidak ditemukan');
            }

            // Check permissions
            const canPost = ['SUPERADMIN', 'ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(
                requestingUser.role
            );

            if (!canPost) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk memposting voucher');
            }

            // Can only post if DISETUJUI
            if (voucher.status !== StatusVoucher.DISETUJUI) {
                throw new ValidationError('Hanya voucher dengan status DISETUJUI yang dapat diposting');
            }

            // Already posted?
            if (voucher.isPosted) {
                throw new ValidationError('Voucher sudah diposting');
            }

            // TODO: Create journal entries from voucher details
            // This would involve creating JurnalUmum and JurnalDetail records

            // Update voucher as posted
            const postedVoucher = await prisma.voucher.update({
                where: { id: voucherId },
                data: {
                    status: StatusVoucher.DIPOSTING,
                    isPosted: true,
                    postedAt: data.tanggalPosting ? new Date(data.tanggalPosting) : new Date(),
                    postedBy: requestingUserId,
                },
            });

            logger.info(`Voucher posted: ${postedVoucher.nomorVoucher} by ${requestingUser.email}`);

            return postedVoucher;
        } catch (error) {
            logger.error('Post voucher error:', error);
            throw error;
        }
    }

    /**
     * Reverse voucher
     */
    async reverseVoucher(
        voucherId: string,
        data: ReverseVoucherInput['body'],
        requestingUserId: string
    ): Promise<Voucher> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const voucher = await prisma.voucher.findUnique({
                where: { id: voucherId },
                include: { detail: true },
            });

            if (!voucher) {
                throw new ValidationError('Voucher tidak ditemukan');
            }

            // Check permissions
            const canReverse = ['SUPERADMIN', 'ADMIN', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);

            if (!canReverse) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk reverse voucher');
            }

            // Can only reverse if posted
            if (!voucher.isPosted) {
                throw new ValidationError('Hanya voucher yang sudah diposting yang dapat direverse');
            }

            // Already reversed?
            if (voucher.isReversed) {
                throw new ValidationError('Voucher sudah direverse');
            }

            // TODO: Create reversal journal entries

            // Update voucher as reversed
            const reversedVoucher = await prisma.voucher.update({
                where: { id: voucherId },
                data: {
                    status: StatusVoucher.REVERSED,
                    isReversed: true,
                    reversedAt: data.tanggalReversal ? new Date(data.tanggalReversal) : new Date(),
                    reversedBy: requestingUserId,
                    catatan: data.alasan,
                },
            });

            logger.info(`Voucher reversed: ${reversedVoucher.nomorVoucher} by ${requestingUser.email}`);

            return reversedVoucher;
        } catch (error) {
            logger.error('Reverse voucher error:', error);
            throw error;
        }
    }

    /**
     * Delete voucher (only if DRAFT or DITOLAK)
     */
    async deleteVoucher(voucherId: string, requestingUserId: string): Promise<void> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const voucher = await prisma.voucher.findUnique({
                where: { id: voucherId },
            });

            if (!voucher) {
                throw new ValidationError('Voucher tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === voucher.perusahaanId;
            const canDelete = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);

            if (!isSuperAdmin && !(isOwnCompany && canDelete)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk menghapus voucher ini');
            }

            // Can only delete if DRAFT or DITOLAK
            const allowedStatuses: StatusVoucher[] = [StatusVoucher.DRAFT, StatusVoucher.DITOLAK];
            if (!allowedStatuses.includes(voucher.status)) {
                throw new ValidationError('Hanya voucher dengan status DRAFT atau DITOLAK yang dapat dihapus');
            }

            // Delete voucher (cascade will delete details)
            await prisma.voucher.delete({
                where: { id: voucherId },
            });

            logger.info(`Voucher deleted: ${voucher.nomorVoucher} by ${requestingUser.email}`);
        } catch (error) {
            logger.error('Delete voucher error:', error);
            throw error;
        }
    }

    /**
     * Submit voucher for approval
     */
    async submitForApproval(voucherId: string, requestingUserId: string): Promise<Voucher> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const voucher = await prisma.voucher.findUnique({
                where: { id: voucherId },
            });

            if (!voucher) {
                throw new ValidationError('Voucher tidak ditemukan');
            }

            // Can only submit if DRAFT
            if (voucher.status !== StatusVoucher.DRAFT) {
                throw new ValidationError('Hanya voucher dengan status DRAFT yang dapat disubmit');
            }

            // Update status
            const submittedVoucher = await prisma.voucher.update({
                where: { id: voucherId },
                data: {
                    status: StatusVoucher.MENUNGGU_PERSETUJUAN,
                },
            });

            logger.info(`Voucher submitted for approval: ${submittedVoucher.nomorVoucher} by ${requestingUser.email}`);

            return submittedVoucher;
        } catch (error) {
            logger.error('Submit voucher error:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const voucherService = new VoucherService();

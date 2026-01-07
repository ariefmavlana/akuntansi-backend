import prisma from '@/config/database';
import logger from '@/utils/logger';
import { Pembayaran, Prisma } from '@prisma/client';
import type {
    CreatePaymentInput,
    ListPaymentsInput,
    GetPaymentSummaryInput,
} from '@/validators/payment.validator';
import { AuthenticationError, ValidationError } from './auth.service';

/**
 * Payment Service
 * Handles payment recording and allocation
 */
export class PaymentService {
    /**
     * Generate payment number
     */
    private async generatePaymentNumber(perusahaanId: string, tanggal: Date): Promise<string> {
        const year = tanggal.getFullYear();
        const month = String(tanggal.getMonth() + 1).padStart(2, '0');

        const count = await prisma.pembayaran.count({
            where: {
                transaksi: { perusahaanId },
                tanggal: {
                    gte: new Date(year, tanggal.getMonth(), 1),
                    lt: new Date(year, tanggal.getMonth() + 1, 1),
                },
            },
        });

        const sequence = String(count + 1).padStart(4, '0');
        return `PAY/${year}${month}/${sequence}`;
    }

    /**
     * Create payment
     */
    async createPayment(data: CreatePaymentInput, requestingUserId: string): Promise<Pembayaran> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Get transaction
            const transaction = await prisma.transaksi.findUnique({
                where: { id: data.transaksiId },
            });

            if (!transaction) {
                throw new ValidationError('Transaksi tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === transaction.perusahaanId;
            const canCreate = ['ADMIN', 'CASHIER', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(
                requestingUser.role
            );

            if (!isSuperAdmin && !(isOwnCompany && canCreate)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk membuat pembayaran');
            }

            // Check if payment exceeds remaining amount
            const sisaPembayaran = transaction.sisaPembayaran.toNumber();
            if (data.jumlah > sisaPembayaran) {
                throw new ValidationError(
                    `Jumlah pembayaran (${data.jumlah}) melebihi sisa pembayaran (${sisaPembayaran})`
                );
            }

            // Generate payment number
            const tanggal = typeof data.tanggal === 'string' ? new Date(data.tanggal) : data.tanggal;
            const nomorPembayaran =
                data.nomorPembayaran ||
                (await this.generatePaymentNumber(transaction.perusahaanId, tanggal));

            // Create payment
            const payment = await prisma.pembayaran.create({
                data: {
                    transaksiId: data.transaksiId,
                    nomorPembayaran,
                    tanggal,
                    tipePembayaran: data.tipePembayaran as any,
                    jumlah: data.jumlah,
                    bankRekeningId: data.bankRekeningId,
                    nomorReferensi: data.nomorReferensi,
                    kurs: data.kurs,
                    jumlahAsli: data.jumlahAsli,
                    biayaAdmin: data.biayaAdmin || 0,
                    keterangan: data.keterangan,
                },
            });

            // Update transaction payment status
            const newTotalDibayar = transaction.totalDibayar.toNumber() + data.jumlah;
            const newSisaPembayaran = transaction.total.toNumber() - newTotalDibayar;

            let newStatus = transaction.statusPembayaran;
            if (newSisaPembayaran <= 0) {
                newStatus = 'LUNAS';
            } else if (newTotalDibayar > 0) {
                newStatus = 'DIBAYAR_SEBAGIAN';
            }

            await prisma.transaksi.update({
                where: { id: data.transaksiId },
                data: {
                    totalDibayar: newTotalDibayar,
                    sisaPembayaran: newSisaPembayaran,
                    statusPembayaran: newStatus,
                },
            });

            logger.info(`Payment created: ${payment.nomorPembayaran} by ${requestingUser.email}`);

            return payment;
        } catch (error) {
            logger.error('Create payment error:', error);
            throw error;
        }
    }

    /**
     * Get payment by ID
     */
    async getPaymentById(paymentId: string, requestingUserId: string): Promise<Pembayaran> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const payment = await prisma.pembayaran.findUnique({
                where: { id: paymentId },
                include: {
                    transaksi: {
                        select: {
                            id: true,
                            nomorTransaksi: true,
                            total: true,
                            totalDibayar: true,
                            sisaPembayaran: true,
                            statusPembayaran: true,
                            perusahaanId: true,
                        },
                    },
                    bankRekening: true,
                },
            });

            if (!payment) {
                throw new ValidationError('Pembayaran tidak ditemukan');
            }

            // Check permissions
            if (
                requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== payment.transaksi.perusahaanId
            ) {
                throw new AuthenticationError('Anda tidak memiliki akses ke pembayaran ini');
            }

            return payment;
        } catch (error) {
            logger.error('Get payment by ID error:', error);
            throw error;
        }
    }

    /**
     * List payments
     */
    async listPayments(filters: ListPaymentsInput, requestingUserId: string) {
        try {
            const {
                page = 1,
                limit = 20,
                transaksiId,
                perusahaanId,
                tipePembayaran,
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
            const where: Prisma.PembayaranWhereInput = {};

            if (transaksiId) {
                where.transaksiId = transaksiId;
            }

            // Company filter
            if (requestingUser.role !== 'SUPERADMIN') {
                where.transaksi = { perusahaanId: requestingUser.perusahaanId };
            } else if (perusahaanId) {
                where.transaksi = { perusahaanId };
            }

            if (tipePembayaran) {
                where.tipePembayaran = tipePembayaran as any;
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

            const total = await prisma.pembayaran.count({ where });

            const payments = await prisma.pembayaran.findMany({
                where,
                select: {
                    id: true,
                    nomorPembayaran: true,
                    tanggal: true,
                    tipePembayaran: true,
                    jumlah: true,
                    isPosted: true,
                    transaksi: {
                        select: {
                            nomorTransaksi: true,
                            pelanggan: { select: { nama: true } },
                            pemasok: { select: { nama: true } },
                        },
                    },
                    createdAt: true,
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { tanggal: 'desc' },
            });

            return {
                data: payments,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('List payments error:', error);
            throw error;
        }
    }

    /**
     * Get payment summary
     */
    async getPaymentSummary(filters: GetPaymentSummaryInput, requestingUserId: string) {
        try {
            const { perusahaanId, tanggalMulai, tanggalAkhir } = filters;

            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            if (requestingUser.role !== 'SUPERADMIN' && requestingUser.perusahaanId !== perusahaanId) {
                throw new AuthenticationError('Anda tidak memiliki akses ke data perusahaan ini');
            }

            const where: Prisma.PembayaranWhereInput = {
                transaksi: { perusahaanId },
            };

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

            const payments = await prisma.pembayaran.findMany({
                where,
                select: {
                    tipePembayaran: true,
                    jumlah: true,
                },
            });

            // Group by payment type
            const summary = payments.reduce((acc, payment) => {
                const type = payment.tipePembayaran;
                if (!acc[type]) {
                    acc[type] = { count: 0, total: 0 };
                }
                acc[type].count++;
                acc[type].total += payment.jumlah.toNumber();
                return acc;
            }, {} as Record<string, any>);

            const totalAmount = payments.reduce((sum, p) => sum + p.jumlah.toNumber(), 0);

            return {
                summary,
                totalPayments: payments.length,
                totalAmount,
            };
        } catch (error) {
            logger.error('Get payment summary error:', error);
            throw error;
        }
    }

    /**
     * Delete payment
     */
    async deletePayment(paymentId: string, requestingUserId: string): Promise<void> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const payment = await prisma.pembayaran.findUnique({
                where: { id: paymentId },
                include: { transaksi: true },
            });

            if (!payment) {
                throw new ValidationError('Pembayaran tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === payment.transaksi.perusahaanId;
            const canDelete = ['ADMIN', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);

            if (!isSuperAdmin && !(isOwnCompany && canDelete)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk menghapus pembayaran ini');
            }

            if (payment.isPosted) {
                throw new ValidationError('Tidak dapat menghapus pembayaran yang sudah diposting');
            }

            // Reverse transaction payment status
            const newTotalDibayar = payment.transaksi.totalDibayar.toNumber() - payment.jumlah.toNumber();
            const newSisaPembayaran = payment.transaksi.total.toNumber() - newTotalDibayar;

            let newStatus = payment.transaksi.statusPembayaran;
            if (newTotalDibayar === 0) {
                newStatus = 'BELUM_DIBAYAR';
            } else if (newSisaPembayaran > 0) {
                newStatus = 'DIBAYAR_SEBAGIAN';
            }

            await prisma.transaksi.update({
                where: { id: payment.transaksiId },
                data: {
                    totalDibayar: newTotalDibayar,
                    sisaPembayaran: newSisaPembayaran,
                    statusPembayaran: newStatus,
                },
            });

            await prisma.pembayaran.delete({
                where: { id: paymentId },
            });

            logger.info(`Payment deleted: ${payment.nomorPembayaran} by ${requestingUser.email}`);
        } catch (error) {
            logger.error('Delete payment error:', error);
            throw error;
        }
    }
}

export const paymentService = new PaymentService();

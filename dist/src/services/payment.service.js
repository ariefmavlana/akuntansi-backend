"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const auth_service_1 = require("./auth.service");
/**
 * Payment Service
 * Handles payment recording and allocation
 */
class PaymentService {
    /**
     * Generate payment number
     */
    async generatePaymentNumber(perusahaanId, tanggal) {
        const year = tanggal.getFullYear();
        const month = String(tanggal.getMonth() + 1).padStart(2, '0');
        const count = await database_1.default.pembayaran.count({
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
    async createPayment(data, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Get transaction
            const transaction = await database_1.default.transaksi.findUnique({
                where: { id: data.transaksiId },
            });
            if (!transaction) {
                throw new auth_service_1.ValidationError('Transaksi tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === transaction.perusahaanId;
            const canCreate = ['ADMIN', 'CASHIER', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && canCreate)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk membuat pembayaran');
            }
            // Check if payment exceeds remaining amount
            const sisaPembayaran = transaction.sisaPembayaran.toNumber();
            if (data.jumlah > sisaPembayaran) {
                throw new auth_service_1.ValidationError(`Jumlah pembayaran (${data.jumlah}) melebihi sisa pembayaran (${sisaPembayaran})`);
            }
            // Generate payment number
            const tanggal = typeof data.tanggal === 'string' ? new Date(data.tanggal) : data.tanggal;
            const nomorPembayaran = data.nomorPembayaran ||
                (await this.generatePaymentNumber(transaction.perusahaanId, tanggal));
            // Create payment
            const payment = await database_1.default.pembayaran.create({
                data: {
                    transaksiId: data.transaksiId,
                    nomorPembayaran,
                    tanggal,
                    tipePembayaran: data.tipePembayaran,
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
            }
            else if (newTotalDibayar > 0) {
                newStatus = 'DIBAYAR_SEBAGIAN';
            }
            await database_1.default.transaksi.update({
                where: { id: data.transaksiId },
                data: {
                    totalDibayar: newTotalDibayar,
                    sisaPembayaran: newSisaPembayaran,
                    statusPembayaran: newStatus,
                },
            });
            logger_1.default.info(`Payment created: ${payment.nomorPembayaran} by ${requestingUser.email}`);
            return payment;
        }
        catch (error) {
            logger_1.default.error('Create payment error:', error);
            throw error;
        }
    }
    /**
     * Get payment by ID
     */
    async getPaymentById(paymentId, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const payment = await database_1.default.pembayaran.findUnique({
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
                throw new auth_service_1.ValidationError('Pembayaran tidak ditemukan');
            }
            // Check permissions
            if (requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== payment.transaksi.perusahaanId) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses ke pembayaran ini');
            }
            return payment;
        }
        catch (error) {
            logger_1.default.error('Get payment by ID error:', error);
            throw error;
        }
    }
    /**
     * List payments
     */
    async listPayments(filters, requestingUserId) {
        try {
            const { page = 1, limit = 20, transaksiId, perusahaanId, tipePembayaran, tanggalMulai, tanggalAkhir, isPosted, } = filters;
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Build where clause
            const where = {};
            if (transaksiId) {
                where.transaksiId = transaksiId;
            }
            // Company filter
            if (requestingUser.role !== 'SUPERADMIN') {
                where.transaksi = { perusahaanId: requestingUser.perusahaanId };
            }
            else if (perusahaanId) {
                where.transaksi = { perusahaanId };
            }
            if (tipePembayaran) {
                where.tipePembayaran = tipePembayaran;
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
            const total = await database_1.default.pembayaran.count({ where });
            const payments = await database_1.default.pembayaran.findMany({
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
        }
        catch (error) {
            logger_1.default.error('List payments error:', error);
            throw error;
        }
    }
    /**
     * Get payment summary
     */
    async getPaymentSummary(filters, requestingUserId) {
        try {
            const { perusahaanId, tanggalMulai, tanggalAkhir } = filters;
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            if (requestingUser.role !== 'SUPERADMIN' && requestingUser.perusahaanId !== perusahaanId) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses ke data perusahaan ini');
            }
            const where = {
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
            const payments = await database_1.default.pembayaran.findMany({
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
            }, {});
            const totalAmount = payments.reduce((sum, p) => sum + p.jumlah.toNumber(), 0);
            return {
                summary,
                totalPayments: payments.length,
                totalAmount,
            };
        }
        catch (error) {
            logger_1.default.error('Get payment summary error:', error);
            throw error;
        }
    }
    /**
     * Delete payment
     */
    async deletePayment(paymentId, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const payment = await database_1.default.pembayaran.findUnique({
                where: { id: paymentId },
                include: { transaksi: true },
            });
            if (!payment) {
                throw new auth_service_1.ValidationError('Pembayaran tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === payment.transaksi.perusahaanId;
            const canDelete = ['ADMIN', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && canDelete)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk menghapus pembayaran ini');
            }
            if (payment.isPosted) {
                throw new auth_service_1.ValidationError('Tidak dapat menghapus pembayaran yang sudah diposting');
            }
            // Reverse transaction payment status
            const newTotalDibayar = payment.transaksi.totalDibayar.toNumber() - payment.jumlah.toNumber();
            const newSisaPembayaran = payment.transaksi.total.toNumber() - newTotalDibayar;
            let newStatus = payment.transaksi.statusPembayaran;
            if (newTotalDibayar === 0) {
                newStatus = 'BELUM_DIBAYAR';
            }
            else if (newSisaPembayaran > 0) {
                newStatus = 'DIBAYAR_SEBAGIAN';
            }
            await database_1.default.transaksi.update({
                where: { id: payment.transaksiId },
                data: {
                    totalDibayar: newTotalDibayar,
                    sisaPembayaran: newSisaPembayaran,
                    statusPembayaran: newStatus,
                },
            });
            await database_1.default.pembayaran.delete({
                where: { id: paymentId },
            });
            logger_1.default.info(`Payment deleted: ${payment.nomorPembayaran} by ${requestingUser.email}`);
        }
        catch (error) {
            logger_1.default.error('Delete payment error:', error);
            throw error;
        }
    }
}
exports.PaymentService = PaymentService;
exports.paymentService = new PaymentService();

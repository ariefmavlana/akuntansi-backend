"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionService = exports.TransactionService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const client_1 = require("@prisma/client");
const auth_service_1 = require("./auth.service");
/**
 * Transaction Service
 * Handles transaction management with double-entry bookkeeping
 */
class TransactionService {
    /**
     * Generate transaction number
     */
    async generateTransactionNumber(perusahaanId, tipe, tanggal) {
        const year = tanggal.getFullYear();
        const month = String(tanggal.getMonth() + 1).padStart(2, '0');
        // Get count for this month
        const count = await database_1.default.transaksi.count({
            where: {
                perusahaanId,
                tipe: tipe,
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
     * Create transaction
     */
    async createTransaction(data, requestingUserId) {
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
            const canCreate = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT', 'STAFF'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && canCreate)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk membuat transaksi');
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
            // Generate transaction number if not provided
            const tanggal = typeof data.tanggal === 'string' ? new Date(data.tanggal) : data.tanggal;
            const nomorTransaksi = data.nomorTransaksi ||
                (await this.generateTransactionNumber(data.perusahaanId, data.tipe, tanggal));
            // Check if transaction number already exists
            const existing = await database_1.default.transaksi.findFirst({
                where: {
                    perusahaanId: data.perusahaanId,
                    nomorTransaksi,
                },
            });
            if (existing) {
                throw new auth_service_1.ValidationError('Nomor transaksi sudah digunakan');
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
                if (!account.allowManualEntry) {
                    throw new auth_service_1.ValidationError(`Akun ${account.namaAkun} tidak mengizinkan input manual`);
                }
            }
            // Calculate totals
            const subtotal = data.detail.reduce((sum, d) => sum + d.subtotal, 0);
            const total = subtotal - data.diskon + data.jumlahPajak + (data.biayaLain || 0);
            // Create transaction with details
            const transaction = await database_1.default.transaksi.create({
                data: {
                    perusahaanId: data.perusahaanId,
                    cabangId: data.cabangId,
                    penggunaId: requestingUserId,
                    nomorTransaksi,
                    tanggal,
                    tanggalJatuhTempo: typeof data.tanggalJatuhTempo === 'string'
                        ? new Date(data.tanggalJatuhTempo)
                        : data.tanggalJatuhTempo,
                    tipe: data.tipe,
                    pelangganId: data.pelangganId,
                    pemasokId: data.supplierId,
                    referensi: data.referensi,
                    deskripsi: data.deskripsi,
                    subtotal,
                    diskon: data.diskon,
                    pajakId: data.pajakId,
                    nilaiPajak: data.jumlahPajak,
                    total,
                    totalDibayar: 0,
                    sisaPembayaran: total,
                    statusPembayaran: client_1.StatusPembayaran.BELUM_DIBAYAR,
                    isPosted: false,
                    detail: {
                        create: data.detail.map((d) => ({
                            urutan: d.urutan,
                            akunId: d.akunId,
                            deskripsi: d.deskripsi,
                            kuantitas: d.kuantitas,
                            hargaSatuan: d.hargaSatuan,
                            diskon: d.diskon,
                            subtotal: d.subtotal,
                            persediaanId: d.persediaanId,
                            asetTetapId: d.asetTetapId,
                            catatan: d.catatan,
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
            logger_1.default.info(`Transaction created: ${transaction.nomorTransaksi} by ${requestingUser.email}`);
            return transaction;
        }
        catch (error) {
            logger_1.default.error('Create transaction error:', error);
            throw error;
        }
    }
    /**
     * Get transaction by ID
     */
    async getTransactionById(transactionId, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const transaction = await database_1.default.transaksi.findUnique({
                where: { id: transactionId },
                include: {
                    detail: {
                        include: {
                            akun: true,
                            persediaan: true,
                            asetTetap: true,
                        },
                        orderBy: { urutan: 'asc' },
                    },
                    pelanggan: true,
                    pemasok: true,
                    pembayaran: true,
                    voucher: true,
                    pengguna: {
                        select: {
                            id: true,
                            namaLengkap: true,
                            email: true,
                        },
                    },
                },
            });
            if (!transaction) {
                throw new auth_service_1.ValidationError('Transaksi tidak ditemukan');
            }
            // Check permissions
            if (requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== transaction.perusahaanId) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses ke transaksi ini');
            }
            return transaction;
        }
        catch (error) {
            logger_1.default.error('Get transaction by ID error:', error);
            throw error;
        }
    }
    /**
     * List transactions with pagination and filters
     */
    async listTransactions(filters, requestingUserId) {
        try {
            const { page = 1, limit = 20, perusahaanId, cabangId, periodeId, tipe, statusPembayaran, pelangganId, supplierId, search, tanggalMulai, tanggalAkhir, isPosted, } = filters;
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            // Build where clause
            const where = {};
            // Non-SUPERADMIN can only see their company's transactions
            if (requestingUser.role !== 'SUPERADMIN') {
                where.perusahaanId = requestingUser.perusahaanId;
            }
            else if (perusahaanId) {
                where.perusahaanId = perusahaanId;
            }
            if (cabangId) {
                where.cabangId = cabangId;
            }
            if (periodeId) {
                const periode = await database_1.default.periodeAkuntansi.findUnique({
                    where: { id: periodeId },
                });
                if (periode) {
                    where.tanggal = {
                        gte: periode.tanggalMulai,
                        lte: periode.tanggalAkhir,
                    };
                }
            }
            if (tipe) {
                where.tipe = tipe;
            }
            if (statusPembayaran) {
                where.statusPembayaran = statusPembayaran;
            }
            if (pelangganId) {
                where.pelangganId = pelangganId;
            }
            if (supplierId) {
                where.pemasokId = supplierId;
            }
            if (isPosted !== undefined) {
                where.isPosted = isPosted;
            }
            if (tanggalMulai || tanggalAkhir) {
                where.tanggal = {};
                if (tanggalMulai) {
                    where.tanggal.gte = typeof tanggalMulai === 'string' ? new Date(tanggalMulai) : tanggalMulai;
                }
                if (tanggalAkhir) {
                    where.tanggal.lte = typeof tanggalAkhir === 'string' ? new Date(tanggalAkhir) : tanggalAkhir;
                }
            }
            if (search) {
                where.OR = [
                    { nomorTransaksi: { contains: search, mode: 'insensitive' } },
                    { deskripsi: { contains: search, mode: 'insensitive' } },
                    { referensi: { contains: search, mode: 'insensitive' } },
                ];
            }
            // Get total count
            const total = await database_1.default.transaksi.count({ where });
            // Get transactions
            const transactions = await database_1.default.transaksi.findMany({
                where,
                select: {
                    id: true,
                    nomorTransaksi: true,
                    tanggal: true,
                    tipe: true,
                    deskripsi: true,
                    total: true,
                    totalDibayar: true,
                    sisaPembayaran: true,
                    statusPembayaran: true,
                    isPosted: true,
                    isVoid: true,
                    pelanggan: {
                        select: {
                            nama: true,
                        },
                    },
                    pemasok: {
                        select: {
                            nama: true,
                        },
                    },
                    pengguna: {
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
                data: transactions,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            logger_1.default.error('List transactions error:', error);
            throw error;
        }
    }
    /**
     * Update transaction (only if not posted)
     */
    async updateTransaction(transactionId, data, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const transaction = await database_1.default.transaksi.findUnique({
                where: { id: transactionId },
                include: { detail: true },
            });
            if (!transaction) {
                throw new auth_service_1.ValidationError('Transaksi tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === transaction.perusahaanId;
            const canUpdate = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && canUpdate)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk mengupdate transaksi ini');
            }
            // Cannot update if posted
            if (transaction.isPosted) {
                throw new auth_service_1.ValidationError('Transaksi yang sudah diposting tidak dapat diubah');
            }
            // Cannot update if voided
            if (transaction.isVoid) {
                throw new auth_service_1.ValidationError('Transaksi yang sudah divoid tidak dapat diubah');
            }
            // Update transaction
            const updateData = {};
            if (data.tanggal) {
                updateData.tanggal = typeof data.tanggal === 'string' ? new Date(data.tanggal) : data.tanggal;
            }
            if (data.tanggalJatuhTempo !== undefined) {
                updateData.tanggalJatuhTempo =
                    data.tanggalJatuhTempo === null
                        ? null
                        : typeof data.tanggalJatuhTempo === 'string'
                            ? new Date(data.tanggalJatuhTempo)
                            : data.tanggalJatuhTempo;
            }
            if (data.pelangganId !== undefined) {
                updateData.pelanggan = data.pelangganId ? { connect: { id: data.pelangganId } } : { disconnect: true };
            }
            if (data.supplierId !== undefined) {
                updateData.pemasok = data.supplierId ? { connect: { id: data.supplierId } } : { disconnect: true };
            }
            if (data.deskripsi) {
                updateData.deskripsi = data.deskripsi;
            }
            if (data.referensi !== undefined) {
                updateData.referensi = data.referensi;
            }
            // If detail is provided, replace all details
            if (data.detail) {
                // Delete existing details
                await database_1.default.transaksiDetail.deleteMany({
                    where: { transaksiId: transactionId },
                });
                // Recalculate totals
                const subtotal = data.detail.reduce((sum, d) => sum + d.subtotal, 0);
                const total = subtotal - (data.diskon ?? transaction.diskon.toNumber()) + (data.jumlahPajak ?? transaction.nilaiPajak.toNumber());
                updateData.subtotal = subtotal;
                updateData.total = total;
                updateData.sisaPembayaran = total - transaction.totalDibayar.toNumber();
                updateData.detail = {
                    create: data.detail.map((d) => ({
                        urutan: d.urutan,
                        akunId: d.akunId,
                        deskripsi: d.deskripsi,
                        kuantitas: d.kuantitas,
                        hargaSatuan: d.hargaSatuan,
                        diskon: d.diskon,
                        subtotal: d.subtotal,
                        persediaanId: d.persediaanId,
                        asetTetapId: d.asetTetapId,
                        catatan: d.catatan,
                    })),
                };
            }
            const updatedTransaction = await database_1.default.transaksi.update({
                where: { id: transactionId },
                data: updateData,
                include: {
                    detail: {
                        include: {
                            akun: true,
                        },
                    },
                },
            });
            logger_1.default.info(`Transaction updated: ${updatedTransaction.nomorTransaksi} by ${requestingUser.email}`);
            return updatedTransaction;
        }
        catch (error) {
            logger_1.default.error('Update transaction error:', error);
            throw error;
        }
    }
    /**
     * Post transaction (create journal entries)
     */
    async postTransaction(transactionId, data, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const transaction = await database_1.default.transaksi.findUnique({
                where: { id: transactionId },
                include: { detail: { include: { akun: true } } },
            });
            if (!transaction) {
                throw new auth_service_1.ValidationError('Transaksi tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === transaction.perusahaanId;
            const canPost = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && canPost)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk memposting transaksi ini');
            }
            // Cannot post if already posted
            if (transaction.isPosted) {
                throw new auth_service_1.ValidationError('Transaksi sudah diposting');
            }
            // Cannot post if voided
            if (transaction.isVoid) {
                throw new auth_service_1.ValidationError('Transaksi yang sudah divoid tidak dapat diposting');
            }
            // TODO: Create journal entries from transaction details
            // This would involve creating JurnalUmum and JurnalDetail records
            // based on the transaction type and details
            // Update transaction as posted
            const postedTransaction = await database_1.default.transaksi.update({
                where: { id: transactionId },
                data: {
                    isPosted: true,
                    postedAt: data.tanggalPosting ? new Date(data.tanggalPosting) : new Date(),
                    postedBy: requestingUserId,
                },
                include: {
                    detail: {
                        include: {
                            akun: true,
                        },
                    },
                },
            });
            logger_1.default.info(`Transaction posted: ${postedTransaction.nomorTransaksi} by ${requestingUser.email}`);
            return postedTransaction;
        }
        catch (error) {
            logger_1.default.error('Post transaction error:', error);
            throw error;
        }
    }
    /**
     * Void transaction
     */
    async voidTransaction(transactionId, data, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const transaction = await database_1.default.transaksi.findUnique({
                where: { id: transactionId },
            });
            if (!transaction) {
                throw new auth_service_1.ValidationError('Transaksi tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === transaction.perusahaanId;
            const canVoid = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && canVoid)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk void transaksi ini');
            }
            // Cannot void if already voided
            if (transaction.isVoid) {
                throw new auth_service_1.ValidationError('Transaksi sudah divoid');
            }
            // TODO: Create reversal journal entries if transaction was posted
            // Update transaction as voided
            const voidedTransaction = await database_1.default.transaksi.update({
                where: { id: transactionId },
                data: {
                    isVoid: true,
                    voidAt: new Date(),
                    voidBy: requestingUserId,
                    voidReason: data.alasan,
                },
            });
            logger_1.default.info(`Transaction voided: ${voidedTransaction.nomorTransaksi} by ${requestingUser.email}`);
            return voidedTransaction;
        }
        catch (error) {
            logger_1.default.error('Void transaction error:', error);
            throw error;
        }
    }
    /**
     * Delete transaction (only if not posted)
     */
    async deleteTransaction(transactionId, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const transaction = await database_1.default.transaksi.findUnique({
                where: { id: transactionId },
            });
            if (!transaction) {
                throw new auth_service_1.ValidationError('Transaksi tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === transaction.perusahaanId;
            const canDelete = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && canDelete)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk menghapus transaksi ini');
            }
            // Cannot delete if posted
            if (transaction.isPosted) {
                throw new auth_service_1.ValidationError('Transaksi yang sudah diposting tidak dapat dihapus. Gunakan void sebagai gantinya.');
            }
            // Delete transaction (cascade will delete details)
            await database_1.default.transaksi.delete({
                where: { id: transactionId },
            });
            logger_1.default.info(`Transaction deleted: ${transaction.nomorTransaksi} by ${requestingUser.email}`);
        }
        catch (error) {
            logger_1.default.error('Delete transaction error:', error);
            throw error;
        }
    }
    /**
     * Add payment to transaction
     */
    async addPayment(transactionId, data, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const transaction = await database_1.default.transaksi.findUnique({
                where: { id: transactionId },
            });
            if (!transaction) {
                throw new auth_service_1.ValidationError('Transaksi tidak ditemukan');
            }
            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === transaction.perusahaanId;
            const canPay = ['ADMIN', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT', 'CASHIER'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && canPay)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk menambah pembayaran');
            }
            // Cannot add payment if voided
            if (transaction.isVoid) {
                throw new auth_service_1.ValidationError('Tidak dapat menambah pembayaran ke transaksi yang divoid');
            }
            // Check if payment amount exceeds remaining
            if (data.jumlah > transaction.sisaPembayaran.toNumber()) {
                throw new auth_service_1.ValidationError('Jumlah pembayaran melebihi sisa yang harus dibayar');
            }
            // Generate payment number if not provided
            const tanggal = typeof data.tanggal === 'string' ? new Date(data.tanggal) : data.tanggal;
            const nomorPembayaran = data.nomorPembayaran ||
                (await this.generateTransactionNumber(transaction.perusahaanId, 'PAYMENT', tanggal));
            // Create payment
            const payment = await database_1.default.pembayaran.create({
                data: {
                    transaksiId: transactionId,
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
            const totalDibayar = transaction.totalDibayar.toNumber() + data.jumlah;
            const sisaPembayaran = transaction.total.toNumber() - totalDibayar;
            let statusPembayaran;
            if (sisaPembayaran <= 0) {
                statusPembayaran = client_1.StatusPembayaran.LUNAS;
            }
            else if (totalDibayar > 0) {
                statusPembayaran = client_1.StatusPembayaran.DIBAYAR_SEBAGIAN;
            }
            else {
                statusPembayaran = client_1.StatusPembayaran.BELUM_DIBAYAR;
            }
            await database_1.default.transaksi.update({
                where: { id: transactionId },
                data: {
                    totalDibayar,
                    sisaPembayaran,
                    statusPembayaran,
                },
            });
            logger_1.default.info(`Payment added to transaction ${transaction.nomorTransaksi} by ${requestingUser.email}`);
            return payment;
        }
        catch (error) {
            logger_1.default.error('Add payment error:', error);
            throw error;
        }
    }
}
exports.TransactionService = TransactionService;
// Export singleton instance
exports.transactionService = new TransactionService();

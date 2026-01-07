"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionController = exports.TransactionController = void 0;
const transaction_service_1 = require("../services/transaction.service");
const response_1 = require("../utils/response");
/**
 * Transaction Controller
 * Handles HTTP requests for transaction management endpoints
 */
class TransactionController {
    /**
     * Create new transaction
     * POST /api/v1/transactions
     */
    async createTransaction(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const transaction = await transaction_service_1.transactionService.createTransaction(req.body, requestingUserId);
            (0, response_1.createdResponse)(res, transaction, 'Transaksi berhasil dibuat');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List transactions with pagination and filters
     * GET /api/v1/transactions
     */
    async listTransactions(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const result = await transaction_service_1.transactionService.listTransactions(req.query, requestingUserId);
            (0, response_1.successResponse)(res, result.data, 'Data transaksi berhasil diambil', 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get transaction by ID
     * GET /api/v1/transactions/:id
     */
    async getTransactionById(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const transaction = await transaction_service_1.transactionService.getTransactionById(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, transaction, 'Data transaksi berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update transaction
     * PUT /api/v1/transactions/:id
     */
    async updateTransaction(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const transaction = await transaction_service_1.transactionService.updateTransaction(req.params.id, req.body, requestingUserId);
            (0, response_1.successResponse)(res, transaction, 'Transaksi berhasil diupdate');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Post transaction
     * POST /api/v1/transactions/:id/post
     */
    async postTransaction(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const transaction = await transaction_service_1.transactionService.postTransaction(req.params.id, req.body, requestingUserId);
            (0, response_1.successResponse)(res, transaction, 'Transaksi berhasil diposting');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Void transaction
     * POST /api/v1/transactions/:id/void
     */
    async voidTransaction(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const transaction = await transaction_service_1.transactionService.voidTransaction(req.params.id, req.body, requestingUserId);
            (0, response_1.successResponse)(res, transaction, 'Transaksi berhasil divoid');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete transaction
     * DELETE /api/v1/transactions/:id
     */
    async deleteTransaction(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            await transaction_service_1.transactionService.deleteTransaction(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, null, 'Transaksi berhasil dihapus');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Add payment to transaction
     * POST /api/v1/transactions/:id/payments
     */
    async addPayment(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const payment = await transaction_service_1.transactionService.addPayment(req.params.id, req.body, requestingUserId);
            (0, response_1.createdResponse)(res, payment, 'Pembayaran berhasil ditambahkan');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TransactionController = TransactionController;
// Export singleton instance
exports.transactionController = new TransactionController();

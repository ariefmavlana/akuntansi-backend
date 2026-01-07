import { Request, Response, NextFunction } from 'express';
import { transactionService } from '@/services/transaction.service';
import { successResponse, createdResponse } from '@/utils/response';

/**
 * Transaction Controller
 * Handles HTTP requests for transaction management endpoints
 */
export class TransactionController {
    /**
     * Create new transaction
     * POST /api/v1/transactions
     */
    async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const transaction = await transactionService.createTransaction(req.body, requestingUserId);

            createdResponse(res, transaction, 'Transaksi berhasil dibuat');
        } catch (error) {
            next(error);
        }
    }

    /**
     * List transactions with pagination and filters
     * GET /api/v1/transactions
     */
    async listTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const result = await transactionService.listTransactions(req.query as any, requestingUserId);

            successResponse(res, result.data, 'Data transaksi berhasil diambil', 200, result.meta);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get transaction by ID
     * GET /api/v1/transactions/:id
     */
    async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const transaction = await transactionService.getTransactionById(
                req.params.id,
                requestingUserId
            );

            successResponse(res, transaction, 'Data transaksi berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update transaction
     * PUT /api/v1/transactions/:id
     */
    async updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const transaction = await transactionService.updateTransaction(
                req.params.id,
                req.body,
                requestingUserId
            );

            successResponse(res, transaction, 'Transaksi berhasil diupdate');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Post transaction
     * POST /api/v1/transactions/:id/post
     */
    async postTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const transaction = await transactionService.postTransaction(
                req.params.id,
                req.body,
                requestingUserId
            );

            successResponse(res, transaction, 'Transaksi berhasil diposting');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Void transaction
     * POST /api/v1/transactions/:id/void
     */
    async voidTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const transaction = await transactionService.voidTransaction(
                req.params.id,
                req.body,
                requestingUserId
            );

            successResponse(res, transaction, 'Transaksi berhasil divoid');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete transaction
     * DELETE /api/v1/transactions/:id
     */
    async deleteTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            await transactionService.deleteTransaction(req.params.id, requestingUserId);

            successResponse(res, null, 'Transaksi berhasil dihapus');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Add payment to transaction
     * POST /api/v1/transactions/:id/payments
     */
    async addPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const payment = await transactionService.addPayment(
                req.params.id,
                req.body,
                requestingUserId
            );

            createdResponse(res, payment, 'Pembayaran berhasil ditambahkan');
        } catch (error) {
            next(error);
        }
    }
}

// Export singleton instance
export const transactionController = new TransactionController();

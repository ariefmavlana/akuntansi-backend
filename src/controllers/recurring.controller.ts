import { Request, Response, NextFunction } from 'express';
import { recurringService } from '@/services/recurring.service';
import type {
    CreateRecurringTransactionInput,
    UpdateRecurringTransactionInput,
    GetRecurringTransactionsInput,
} from '@/validators/recurring.validator';

export class RecurringController {
    // Create recurring transaction
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as CreateRecurringTransactionInput;
            const userId = (req as any).user.id;

            const recurring = await recurringService.createRecurring(data, userId);

            return res.status(201).json({
                success: true,
                message: 'Transaksi rekuren berhasil dibuat',
                data: recurring,
            });
        } catch (error) {
            next(error);
        }
    }

    // Get all recurring transactions
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = req.query as unknown as GetRecurringTransactionsInput;
            const result = await recurringService.getRecurringTransactions(filters);

            return res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    // Get single recurring transaction
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const recurring = await recurringService.getRecurringTransaction(id);

            return res.json({
                success: true,
                data: recurring,
            });
        } catch (error) {
            next(error);
        }
    }

    // Update recurring transaction
    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const data = req.body as UpdateRecurringTransactionInput;
            const userId = (req as any).user.id;

            const recurring = await recurringService.updateRecurring(id, data, userId);

            return res.json({
                success: true,
                message: 'Transaksi rekuren berhasil diupdate',
                data: recurring,
            });
        } catch (error) {
            next(error);
        }
    }

    // Execute recurring transaction now
    async execute(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const userId = (req as any).user.id;

            const transaksi = await recurringService.executeRecurring(id, userId);

            return res.json({
                success: true,
                message: 'Transaksi rekuren berhasil dieksekusi',
                data: transaksi,
            });
        } catch (error) {
            next(error);
        }
    }

    // Get recurring transaction history
    async getHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 20;

            const result = await recurringService.getRecurringHistory(id, page, limit);

            return res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete recurring transaction
    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const result = await recurringService.deleteRecurring(id);

            return res.json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }

    // Process due recurring transactions (cron endpoint)
    async processDue(req: Request, res: Response, next: NextFunction) {
        try {
            // This should be protected with API key or internal-only access
            await recurringService.processDueRecurring();

            return res.json({
                success: true,
                message: 'Recurring transactions processed',
            });
        } catch (error) {
            next(error);
        }
    }
}

export const recurringController = new RecurringController();

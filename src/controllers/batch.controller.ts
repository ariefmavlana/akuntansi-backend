import { Response, NextFunction } from 'express';
import { batchService } from '@/services/batch.service';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';
import type {
    BatchTransactionsInput,
    BatchApprovalsInput,
    BatchPostJournalsInput,
    BatchDeleteInput,
} from '@/validators/batch.validator';

export class BatchController {
    // Batch create transactions
    async batchCreateTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const data = req.body as BatchTransactionsInput;
            const result = await batchService.processBatchTransactions(data, req.user!.userId);

            return res.status(201).json({
                success: true,
                message: `Berhasil membuat ${result.results.length} transaksi`,
                data: result.results,
            });
        } catch (error) {
            next(error);
        }
    }

    // Batch process approvals
    async batchProcessApprovals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const data = req.body as BatchApprovalsInput;
            const result = await batchService.processBatchApprovals(data, req.user!.userId);

            return res.json({
                success: true,
                message: `Berhasil memproses ${result.results.length} approval`,
                data: result.results,
            });
        } catch (error) {
            next(error);
        }
    }

    // Batch post journals
    async batchPostJournals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const data = req.body as BatchPostJournalsInput;
            const result = await batchService.processBatchJournalPosting(data, req.user!.userId);

            return res.json({
                success: true,
                message: `Berhasil posting ${result.results.length} jurnal`,
                data: result.results,
            });
        } catch (error) {
            next(error);
        }
    }

    // Batch delete
    async batchDelete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const data = req.body as BatchDeleteInput;
            const result = await batchService.processBatchDelete(data, req.user!.userId);

            return res.json({
                success: true,
                message: `Berhasil menghapus ${result.results.length} ${data.entityType}`,
                data: result.results,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const batchController = new BatchController();

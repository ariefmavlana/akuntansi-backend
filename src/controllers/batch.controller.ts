import { Request, Response, NextFunction } from 'express';
import { batchService } from '@/services/batch.service';
import type {
    BatchTransactionsInput,
    BatchApprovalsInput,
    BatchPostJournalsInput,
    BatchDeleteInput,
} from '@/validators/batch.validator';

export class BatchController {
    // Batch create transactions
    async batchCreateTransactions(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as BatchTransactionsInput;
            const userId = (req as any).user.id;

            const result = await batchService.processBatchTransactions(data, userId);

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
    async batchProcessApprovals(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as BatchApprovalsInput;
            const userId = (req as any).user.id;

            const result = await batchService.processBatchApprovals(data, userId);

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
    async batchPostJournals(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as BatchPostJournalsInput;
            const userId = (req as any).user.id;

            const result = await batchService.processBatchJournalPosting(data, userId);

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
    async batchDelete(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body as BatchDeleteInput;
            const userId = (req as any).user.id;

            const result = await batchService.processBatchDelete(data, userId);

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

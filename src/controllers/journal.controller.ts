import { Request, Response, NextFunction } from 'express';
import { journalService } from '@/services/journal.service';
import { successResponse, createdResponse } from '@/utils/response';

/**
 * Journal Controller
 * Handles HTTP requests for journal and ledger endpoints
 */
export class JournalController {
    /**
     * Create manual journal entry
     * POST /api/v1/journals
     */
    async createJournal(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const journal = await journalService.createJournal(req.body, requestingUserId);

            createdResponse(res, journal, 'Jurnal berhasil dibuat');
        } catch (error) {
            next(error);
        }
    }

    /**
     * List journals with pagination and filters
     * GET /api/v1/journals
     */
    async listJournals(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const result = await journalService.listJournals(req.query as any, requestingUserId);

            successResponse(res, result.data, 'Data jurnal berhasil diambil', 200, result.meta);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get journal by ID
     * GET /api/v1/journals/:id
     */
    async getJournalById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const journal = await journalService.getJournalById(req.params.id, requestingUserId);

            successResponse(res, journal, 'Data jurnal berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get general ledger
     * GET /api/v1/journals/ledger/general
     */
    async getGeneralLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const ledger = await journalService.getGeneralLedger(req.query as any, requestingUserId);

            successResponse(res, ledger, 'General ledger berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get trial balance
     * GET /api/v1/journals/ledger/trial-balance
     */
    async getTrialBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const trialBalance = await journalService.getTrialBalance(req.query as any, requestingUserId);

            successResponse(res, trialBalance, 'Trial balance berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete journal
     * DELETE /api/v1/journals/:id
     */
    async deleteJournal(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            await journalService.deleteJournal(req.params.id, requestingUserId);

            successResponse(res, null, 'Jurnal berhasil dihapus');
        } catch (error) {
            next(error);
        }
    }
}

// Export singleton instance
export const journalController = new JournalController();

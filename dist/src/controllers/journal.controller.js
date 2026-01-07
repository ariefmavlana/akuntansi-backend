"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.journalController = exports.JournalController = void 0;
const journal_service_1 = require("../services/journal.service");
const response_1 = require("../utils/response");
/**
 * Journal Controller
 * Handles HTTP requests for journal and ledger endpoints
 */
class JournalController {
    /**
     * Create manual journal entry
     * POST /api/v1/journals
     */
    async createJournal(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const journal = await journal_service_1.journalService.createJournal(req.body, requestingUserId);
            (0, response_1.createdResponse)(res, journal, 'Jurnal berhasil dibuat');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List journals with pagination and filters
     * GET /api/v1/journals
     */
    async listJournals(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const result = await journal_service_1.journalService.listJournals(req.query, requestingUserId);
            (0, response_1.successResponse)(res, result.data, 'Data jurnal berhasil diambil', 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get journal by ID
     * GET /api/v1/journals/:id
     */
    async getJournalById(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const journal = await journal_service_1.journalService.getJournalById(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, journal, 'Data jurnal berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get general ledger
     * GET /api/v1/journals/ledger/general
     */
    async getGeneralLedger(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const ledger = await journal_service_1.journalService.getGeneralLedger(req.query, requestingUserId);
            (0, response_1.successResponse)(res, ledger, 'General ledger berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get trial balance
     * GET /api/v1/journals/ledger/trial-balance
     */
    async getTrialBalance(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const trialBalance = await journal_service_1.journalService.getTrialBalance(req.query, requestingUserId);
            (0, response_1.successResponse)(res, trialBalance, 'Trial balance berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete journal
     * DELETE /api/v1/journals/:id
     */
    async deleteJournal(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            await journal_service_1.journalService.deleteJournal(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, null, 'Jurnal berhasil dihapus');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.JournalController = JournalController;
// Export singleton instance
exports.journalController = new JournalController();

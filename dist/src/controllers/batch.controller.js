"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchController = exports.BatchController = void 0;
const batch_service_1 = require("../services/batch.service");
class BatchController {
    // Batch create transactions
    async batchCreateTransactions(req, res, next) {
        try {
            const data = req.body;
            const userId = req.user.id;
            const result = await batch_service_1.batchService.processBatchTransactions(data, userId);
            return res.status(201).json({
                success: true,
                message: `Berhasil membuat ${result.results.length} transaksi`,
                data: result.results,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Batch process approvals
    async batchProcessApprovals(req, res, next) {
        try {
            const data = req.body;
            const userId = req.user.id;
            const result = await batch_service_1.batchService.processBatchApprovals(data, userId);
            return res.json({
                success: true,
                message: `Berhasil memproses ${result.results.length} approval`,
                data: result.results,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Batch post journals
    async batchPostJournals(req, res, next) {
        try {
            const data = req.body;
            const userId = req.user.id;
            const result = await batch_service_1.batchService.processBatchJournalPosting(data, userId);
            return res.json({
                success: true,
                message: `Berhasil posting ${result.results.length} jurnal`,
                data: result.results,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Batch delete
    async batchDelete(req, res, next) {
        try {
            const data = req.body;
            const userId = req.user.id;
            const result = await batch_service_1.batchService.processBatchDelete(data, userId);
            return res.json({
                success: true,
                message: `Berhasil menghapus ${result.results.length} ${data.entityType}`,
                data: result.results,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.BatchController = BatchController;
exports.batchController = new BatchController();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recurringController = exports.RecurringController = void 0;
const recurring_service_1 = require("../services/recurring.service");
class RecurringController {
    // Create recurring transaction
    async create(req, res, next) {
        try {
            const data = req.body;
            const userId = req.user.id;
            const recurring = await recurring_service_1.recurringService.createRecurring(data, userId);
            return res.status(201).json({
                success: true,
                message: 'Transaksi rekuren berhasil dibuat',
                data: recurring,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Get all recurring transactions
    async getAll(req, res, next) {
        try {
            const filters = req.query;
            const result = await recurring_service_1.recurringService.getRecurringTransactions(filters);
            return res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Get single recurring transaction
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const recurring = await recurring_service_1.recurringService.getRecurringTransaction(id);
            return res.json({
                success: true,
                data: recurring,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Update recurring transaction
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const data = req.body;
            const userId = req.user.id;
            const recurring = await recurring_service_1.recurringService.updateRecurring(id, data, userId);
            return res.json({
                success: true,
                message: 'Transaksi rekuren berhasil diupdate',
                data: recurring,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Execute recurring transaction now
    async execute(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const transaksi = await recurring_service_1.recurringService.executeRecurring(id, userId);
            return res.json({
                success: true,
                message: 'Transaksi rekuren berhasil dieksekusi',
                data: transaksi,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Get recurring transaction history
    async getHistory(req, res, next) {
        try {
            const { id } = req.params;
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 20;
            const result = await recurring_service_1.recurringService.getRecurringHistory(id, page, limit);
            return res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Delete recurring transaction
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const result = await recurring_service_1.recurringService.deleteRecurring(id);
            return res.json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Process due recurring transactions (cron endpoint)
    async processDue(req, res, next) {
        try {
            // This should be protected with API key or internal-only access
            await recurring_service_1.recurringService.processDueRecurring();
            return res.json({
                success: true,
                message: 'Recurring transactions processed',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RecurringController = RecurringController;
exports.recurringController = new RecurringController();

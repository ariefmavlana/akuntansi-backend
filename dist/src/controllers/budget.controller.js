"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetController = exports.BudgetController = void 0;
const budget_service_1 = require("../services/budget.service");
const response_1 = require("../utils/response");
class BudgetController {
    async create(req, res) {
        const data = req.body;
        const result = await budget_service_1.budgetService.createBudget(data, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Budget berhasil dibuat', 201);
    }
    async update(req, res) {
        const { id } = req.params;
        const data = req.body;
        const result = await budget_service_1.budgetService.updateBudget(id, data, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Budget berhasil diupdate');
    }
    async delete(req, res) {
        const { id } = req.params;
        const result = await budget_service_1.budgetService.deleteBudget(id, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Budget berhasil dihapus');
    }
    async approve(req, res) {
        const { id } = req.params;
        const result = await budget_service_1.budgetService.approveBudget(id, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Budget berhasil disetujui');
    }
    async activate(req, res) {
        const { id } = req.params;
        const result = await budget_service_1.budgetService.activateBudget(id, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Budget berhasil diaktifkan');
    }
    async close(req, res) {
        const { id } = req.params;
        const result = await budget_service_1.budgetService.closeBudget(id, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Budget berhasil ditutup');
    }
    async getAll(req, res) {
        const filters = req.query;
        const result = await budget_service_1.budgetService.getBudgets(filters, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Budgets berhasil diambil');
    }
    async getById(req, res) {
        const { id } = req.params;
        const result = await budget_service_1.budgetService.getBudgetById(id, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Budget berhasil diambil');
    }
    async addDetail(req, res) {
        const { id } = req.params;
        const data = req.body;
        const result = await budget_service_1.budgetService.addBudgetDetail(id, data, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Budget detail berhasil ditambahkan', 201);
    }
    async updateDetail(req, res) {
        const { id, detailId } = req.params;
        const data = req.body;
        const result = await budget_service_1.budgetService.updateBudgetDetail(id, detailId, data, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Budget detail berhasil diupdate');
    }
    async deleteDetail(req, res) {
        const { id, detailId } = req.params;
        const result = await budget_service_1.budgetService.deleteBudgetDetail(id, detailId, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Budget detail berhasil dihapus');
    }
    async createRevision(req, res) {
        const { id } = req.params;
        const data = req.body;
        const result = await budget_service_1.budgetService.createBudgetRevision(id, data, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Budget revision berhasil dibuat', 201);
    }
    async getBudgetVsActual(req, res) {
        const { id } = req.params;
        const { bulan } = req.query;
        const result = await budget_service_1.budgetService.getBudgetVsActual(id, bulan ? parseInt(bulan) : undefined);
        return (0, response_1.successResponse)(res, result, 'Budget vs actual berhasil diambil');
    }
}
exports.BudgetController = BudgetController;
exports.budgetController = new BudgetController();

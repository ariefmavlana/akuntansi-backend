"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.costCenterController = exports.CostCenterController = void 0;
const costCenter_service_1 = require("../services/costCenter.service");
const response_1 = require("../utils/response");
class CostCenterController {
    async create(req, res) {
        const data = req.body;
        const result = await costCenter_service_1.costCenterService.createCostCenter(data, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Cost center berhasil dibuat', 201);
    }
    async update(req, res) {
        const { id } = req.params;
        const data = req.body;
        const result = await costCenter_service_1.costCenterService.updateCostCenter(id, data, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Cost center berhasil diupdate');
    }
    async delete(req, res) {
        const { id } = req.params;
        const result = await costCenter_service_1.costCenterService.deleteCostCenter(id, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Cost center berhasil dihapus');
    }
    async getAll(req, res) {
        const filters = req.query;
        const result = await costCenter_service_1.costCenterService.getCostCenters(filters, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Cost centers berhasil diambil');
    }
    async getById(req, res) {
        const { id } = req.params;
        const result = await costCenter_service_1.costCenterService.getCostCenterById(id, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Cost center berhasil diambil');
    }
    async getTransactions(req, res) {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
        const result = await costCenter_service_1.costCenterService.getCostCenterTransactions(id, startDate, endDate);
        return (0, response_1.successResponse)(res, result, 'Transaksi cost center berhasil diambil');
    }
}
exports.CostCenterController = CostCenterController;
exports.costCenterController = new CostCenterController();

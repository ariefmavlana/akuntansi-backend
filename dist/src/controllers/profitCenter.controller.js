"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profitCenterController = exports.ProfitCenterController = void 0;
const profitCenter_service_1 = require("../services/profitCenter.service");
const response_1 = require("../utils/response");
class ProfitCenterController {
    async create(req, res) {
        const data = req.body;
        const result = await profitCenter_service_1.profitCenterService.createProfitCenter(data, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Profit center berhasil dibuat', 201);
    }
    async update(req, res) {
        const { id } = req.params;
        const data = req.body;
        const result = await profitCenter_service_1.profitCenterService.updateProfitCenter(id, data, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Profit center berhasil diupdate');
    }
    async delete(req, res) {
        const { id } = req.params;
        const result = await profitCenter_service_1.profitCenterService.deleteProfitCenter(id, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Profit center berhasil dihapus');
    }
    async getAll(req, res) {
        const filters = req.query;
        const result = await profitCenter_service_1.profitCenterService.getProfitCenters(filters, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Profit centers berhasil diambil');
    }
    async getById(req, res) {
        const { id } = req.params;
        const result = await profitCenter_service_1.profitCenterService.getProfitCenterById(id, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Profit center berhasil diambil');
    }
    async getPerformance(req, res) {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
        const result = await profitCenter_service_1.profitCenterService.getProfitCenterPerformance(id, startDate, endDate);
        return (0, response_1.successResponse)(res, result, 'Performance profit center berhasil diambil');
    }
}
exports.ProfitCenterController = ProfitCenterController;
exports.profitCenterController = new ProfitCenterController();

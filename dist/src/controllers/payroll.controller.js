"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payrollController = exports.PayrollController = void 0;
const payroll_service_1 = require("../services/payroll.service");
const response_1 = require("../utils/response");
/**
 * Payroll Controller
 * Handles HTTP requests for payroll management endpoints
 */
class PayrollController {
    /**
     * Create payroll (manual)
     * POST /api/v1/payrolls
     */
    async createPayroll(req, res, next) {
        try {
            const payroll = await payroll_service_1.payrollService.createPayroll(req.body);
            (0, response_1.createdResponse)(res, payroll, 'Slip gaji berhasil dibuat');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Generate payroll (batch)
     * POST /api/v1/payrolls/generate
     */
    async generatePayroll(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.generatePayroll(req.body);
            (0, response_1.createdResponse)(res, result, `Berhasil generate ${result.count} data gaji`);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List payrolls
     * GET /api/v1/payrolls
     */
    async listPayrolls(req, res, next) {
        try {
            const result = await payroll_service_1.payrollService.listPayrolls(req.query);
            (0, response_1.successResponse)(res, result.data, 'Data gaji berhasil diambil', 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get payroll by ID
     * GET /api/v1/payrolls/:id
     */
    async getPayrollById(req, res, next) {
        try {
            const payroll = await payroll_service_1.payrollService.getPayrollById(req.params.id);
            if (!payroll) {
                res.status(404).json({ success: false, message: 'Data gaji tidak ditemukan' });
                return;
            }
            (0, response_1.successResponse)(res, payroll, 'Data gaji berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update payroll
     * PUT /api/v1/payrolls/:id
     */
    async updatePayroll(req, res, next) {
        try {
            const payroll = await payroll_service_1.payrollService.updatePayroll(req.params.id, req.body);
            (0, response_1.successResponse)(res, payroll, 'Data gaji berhasil diupdate');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Pay payroll
     * POST /api/v1/payrolls/:id/pay
     */
    async payPayroll(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const payroll = await payroll_service_1.payrollService.payPayroll(req.params.id, req.body, requestingUserId);
            (0, response_1.successResponse)(res, payroll, 'Gaji berhasil dibayar dan dijurnal');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete payroll
     * DELETE /api/v1/payrolls/:id
     */
    async deletePayroll(req, res, next) {
        try {
            await payroll_service_1.payrollService.deletePayroll(req.params.id);
            (0, response_1.successResponse)(res, null, 'Data gaji berhasil dihapus');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PayrollController = PayrollController;
exports.payrollController = new PayrollController();

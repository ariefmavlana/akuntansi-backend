"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierController = exports.SupplierController = void 0;
const supplier_service_1 = require("../services/supplier.service");
const response_1 = require("../utils/response");
/**
 * Supplier Controller
 * Handles HTTP requests for supplier endpoints
 */
class SupplierController {
    /**
     * Create supplier
     * POST /api/v1/suppliers
     */
    async createSupplier(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const supplier = await supplier_service_1.supplierService.createSupplier(req.body, requestingUserId);
            (0, response_1.createdResponse)(res, supplier, 'Pemasok berhasil dibuat');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List suppliers with pagination and filters
     * GET /api/v1/suppliers
     */
    async listSuppliers(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const result = await supplier_service_1.supplierService.listSuppliers(req.query, requestingUserId);
            (0, response_1.successResponse)(res, result.data, 'Data pemasok berhasil diambil', 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get supplier by ID
     * GET /api/v1/suppliers/:id
     */
    async getSupplierById(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const supplier = await supplier_service_1.supplierService.getSupplierById(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, supplier, 'Data pemasok berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update supplier
     * PUT /api/v1/suppliers/:id
     */
    async updateSupplier(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const supplier = await supplier_service_1.supplierService.updateSupplier(req.params.id, req.body, requestingUserId);
            (0, response_1.successResponse)(res, supplier, 'Pemasok berhasil diupdate');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get supplier aging report
     * GET /api/v1/suppliers/aging
     */
    async getSupplierAging(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const aging = await supplier_service_1.supplierService.getSupplierAging(req.query, requestingUserId);
            (0, response_1.successResponse)(res, aging, 'Supplier aging berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Toggle supplier status
     * PUT /api/v1/suppliers/:id/toggle-status
     */
    async toggleSupplierStatus(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const supplier = await supplier_service_1.supplierService.toggleSupplierStatus(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, supplier, 'Status pemasok berhasil diubah');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete supplier
     * DELETE /api/v1/suppliers/:id
     */
    async deleteSupplier(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            await supplier_service_1.supplierService.deleteSupplier(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, null, 'Pemasok berhasil dihapus');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SupplierController = SupplierController;
// Export singleton instance
exports.supplierController = new SupplierController();

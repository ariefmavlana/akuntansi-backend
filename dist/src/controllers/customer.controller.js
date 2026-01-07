"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerController = exports.CustomerController = void 0;
const customer_service_1 = require("../services/customer.service");
const response_1 = require("../utils/response");
/**
 * Customer Controller
 * Handles HTTP requests for customer endpoints
 */
class CustomerController {
    /**
     * Create customer
     * POST /api/v1/customers
     */
    async createCustomer(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const customer = await customer_service_1.customerService.createCustomer(req.body, requestingUserId);
            (0, response_1.createdResponse)(res, customer, 'Pelanggan berhasil dibuat');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List customers with pagination and filters
     * GET /api/v1/customers
     */
    async listCustomers(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const result = await customer_service_1.customerService.listCustomers(req.query, requestingUserId);
            (0, response_1.successResponse)(res, result.data, 'Data pelanggan berhasil diambil', 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get customer by ID
     * GET /api/v1/customers/:id
     */
    async getCustomerById(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const customer = await customer_service_1.customerService.getCustomerById(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, customer, 'Data pelanggan berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update customer
     * PUT /api/v1/customers/:id
     */
    async updateCustomer(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const customer = await customer_service_1.customerService.updateCustomer(req.params.id, req.body, requestingUserId);
            (0, response_1.successResponse)(res, customer, 'Pelanggan berhasil diupdate');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get customer aging report
     * GET /api/v1/customers/aging
     */
    async getCustomerAging(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const aging = await customer_service_1.customerService.getCustomerAging(req.query, requestingUserId);
            (0, response_1.successResponse)(res, aging, 'Customer aging berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Toggle customer status
     * PUT /api/v1/customers/:id/toggle-status
     */
    async toggleCustomerStatus(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const customer = await customer_service_1.customerService.toggleCustomerStatus(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, customer, 'Status pelanggan berhasil diubah');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete customer
     * DELETE /api/v1/customers/:id
     */
    async deleteCustomer(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            await customer_service_1.customerService.deleteCustomer(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, null, 'Pelanggan berhasil dihapus');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CustomerController = CustomerController;
// Export singleton instance
exports.customerController = new CustomerController();

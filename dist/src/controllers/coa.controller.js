"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coaController = exports.CoaController = void 0;
const coa_service_1 = require("../services/coa.service");
const response_1 = require("../utils/response");
/**
 * Chart of Accounts Controller
 * Handles HTTP requests for COA management endpoints
 */
class CoaController {
    /**
     * Create new account
     * POST /api/v1/coa
     */
    async createAccount(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const account = await coa_service_1.coaService.createAccount(req.body, requestingUserId);
            (0, response_1.successResponse)(res, account, 'Akun berhasil dibuat', 201);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List accounts with pagination and filters
     * GET /api/v1/coa
     */
    async listAccounts(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const result = await coa_service_1.coaService.listAccounts(req.query, requestingUserId);
            (0, response_1.successResponse)(res, result.data, 'Data akun berhasil diambil', 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get account by ID
     * GET /api/v1/coa/:id
     */
    async getAccountById(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const account = await coa_service_1.coaService.getAccountById(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, account, 'Data akun berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get account hierarchy
     * GET /api/v1/coa/hierarchy
     */
    async getAccountHierarchy(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const hierarchy = await coa_service_1.coaService.getAccountHierarchy(req.query, requestingUserId);
            (0, response_1.successResponse)(res, hierarchy, 'Hierarki akun berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update account
     * PUT /api/v1/coa/:id
     */
    async updateAccount(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const account = await coa_service_1.coaService.updateAccount(req.params.id, req.body, requestingUserId);
            (0, response_1.successResponse)(res, account, 'Akun berhasil diupdate');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update account balance
     * PUT /api/v1/coa/:id/balance
     */
    async updateAccountBalance(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const account = await coa_service_1.coaService.updateAccountBalance(req.params.id, req.body, requestingUserId);
            (0, response_1.successResponse)(res, account, 'Saldo akun berhasil diupdate');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete account
     * DELETE /api/v1/coa/:id
     */
    async deleteAccount(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            await coa_service_1.coaService.deleteAccount(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, null, 'Akun berhasil dihapus');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CoaController = CoaController;
// Export singleton instance
exports.coaController = new CoaController();

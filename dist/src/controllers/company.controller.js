"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.companyController = exports.CompanyController = void 0;
const company_service_1 = require("../services/company.service");
const response_1 = require("../utils/response");
/**
 * Company Controller
 * Handles HTTP requests for company and branch management endpoints
 */
class CompanyController {
    // ============================================================================
    // COMPANY ENDPOINTS
    // ============================================================================
    /**
     * Create new company
     * POST /api/v1/companies
     */
    async createCompany(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const company = await company_service_1.companyService.createCompany(req.body, requestingUserId);
            (0, response_1.successResponse)(res, company, 'Perusahaan berhasil dibuat', 201);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List companies with pagination and filters
     * GET /api/v1/companies
     */
    async listCompanies(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const result = await company_service_1.companyService.listCompanies(req.query, requestingUserId);
            (0, response_1.successResponse)(res, result.data, 'Data perusahaan berhasil diambil', 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get company by ID
     * GET /api/v1/companies/:id
     */
    async getCompanyById(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const company = await company_service_1.companyService.getCompanyById(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, company, 'Data perusahaan berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update company
     * PUT /api/v1/companies/:id
     */
    async updateCompany(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const company = await company_service_1.companyService.updateCompany(req.params.id, req.body, requestingUserId);
            (0, response_1.successResponse)(res, company, 'Perusahaan berhasil diupdate');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete company
     * DELETE /api/v1/companies/:id
     */
    async deleteCompany(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            await company_service_1.companyService.deleteCompany(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, null, 'Perusahaan berhasil dihapus');
        }
        catch (error) {
            next(error);
        }
    }
    // ============================================================================
    // BRANCH ENDPOINTS
    // ============================================================================
    /**
     * Create new branch
     * POST /api/v1/branches
     */
    async createBranch(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const branch = await company_service_1.companyService.createBranch(req.body, requestingUserId);
            (0, response_1.successResponse)(res, branch, 'Cabang berhasil dibuat', 201);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * List branches with pagination and filters
     * GET /api/v1/branches
     */
    async listBranches(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const result = await company_service_1.companyService.listBranches(req.query, requestingUserId);
            (0, response_1.successResponse)(res, result.data, 'Data cabang berhasil diambil', 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get branch by ID
     * GET /api/v1/branches/:id
     */
    async getBranchById(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const branch = await company_service_1.companyService.getBranchById(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, branch, 'Data cabang berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update branch
     * PUT /api/v1/branches/:id
     */
    async updateBranch(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            const branch = await company_service_1.companyService.updateBranch(req.params.id, req.body, requestingUserId);
            (0, response_1.successResponse)(res, branch, 'Cabang berhasil diupdate');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete branch
     * DELETE /api/v1/branches/:id
     */
    async deleteBranch(req, res, next) {
        try {
            const requestingUserId = req.user.userId;
            await company_service_1.companyService.deleteBranch(req.params.id, requestingUserId);
            (0, response_1.successResponse)(res, null, 'Cabang berhasil dihapus');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.CompanyController = CompanyController;
// Export singleton instance
exports.companyController = new CompanyController();

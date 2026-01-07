import { Request, Response, NextFunction } from 'express';
import { companyService } from '@/services/company.service';
import { successResponse } from '@/utils/response';

/**
 * Company Controller
 * Handles HTTP requests for company and branch management endpoints
 */
export class CompanyController {
    // ============================================================================
    // COMPANY ENDPOINTS
    // ============================================================================

    /**
     * Create new company
     * POST /api/v1/companies
     */
    async createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const company = await companyService.createCompany(req.body, requestingUserId);

            successResponse(res, company, 'Perusahaan berhasil dibuat', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * List companies with pagination and filters
     * GET /api/v1/companies
     */
    async listCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const result = await companyService.listCompanies(req.query as any, requestingUserId);

            successResponse(res, result.data, 'Data perusahaan berhasil diambil', 200, result.meta);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get company by ID
     * GET /api/v1/companies/:id
     */
    async getCompanyById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const company = await companyService.getCompanyById(req.params.id, requestingUserId);

            successResponse(res, company, 'Data perusahaan berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update company
     * PUT /api/v1/companies/:id
     */
    async updateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const company = await companyService.updateCompany(
                req.params.id,
                req.body,
                requestingUserId
            );

            successResponse(res, company, 'Perusahaan berhasil diupdate');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete company
     * DELETE /api/v1/companies/:id
     */
    async deleteCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            await companyService.deleteCompany(req.params.id, requestingUserId);

            successResponse(res, null, 'Perusahaan berhasil dihapus');
        } catch (error) {
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
    async createBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const branch = await companyService.createBranch(req.body, requestingUserId);

            successResponse(res, branch, 'Cabang berhasil dibuat', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * List branches with pagination and filters
     * GET /api/v1/branches
     */
    async listBranches(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const result = await companyService.listBranches(req.query as any, requestingUserId);

            successResponse(res, result.data, 'Data cabang berhasil diambil', 200, result.meta);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get branch by ID
     * GET /api/v1/branches/:id
     */
    async getBranchById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const branch = await companyService.getBranchById(req.params.id, requestingUserId);

            successResponse(res, branch, 'Data cabang berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update branch
     * PUT /api/v1/branches/:id
     */
    async updateBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const branch = await companyService.updateBranch(req.params.id, req.body, requestingUserId);

            successResponse(res, branch, 'Cabang berhasil diupdate');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete branch
     * DELETE /api/v1/branches/:id
     */
    async deleteBranch(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            await companyService.deleteBranch(req.params.id, requestingUserId);

            successResponse(res, null, 'Cabang berhasil dihapus');
        } catch (error) {
            next(error);
        }
    }
}

// Export singleton instance
export const companyController = new CompanyController();

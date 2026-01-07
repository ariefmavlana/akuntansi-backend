import { Request, Response, NextFunction } from 'express';
import { coaService } from '@/services/coa.service';
import { successResponse } from '@/utils/response';

/**
 * Chart of Accounts Controller
 * Handles HTTP requests for COA management endpoints
 */
export class CoaController {
    /**
     * Create new account
     * POST /api/v1/coa
     */
    async createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const account = await coaService.createAccount(req.body, requestingUserId);

            successResponse(res, account, 'Akun berhasil dibuat', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * List accounts with pagination and filters
     * GET /api/v1/coa
     */
    async listAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const result = await coaService.listAccounts(req.query as any, requestingUserId);

            successResponse(res, result.data, 'Data akun berhasil diambil', 200, result.meta);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get account by ID
     * GET /api/v1/coa/:id
     */
    async getAccountById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const account = await coaService.getAccountById(req.params.id, requestingUserId);

            successResponse(res, account, 'Data akun berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get account hierarchy
     * GET /api/v1/coa/hierarchy
     */
    async getAccountHierarchy(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const hierarchy = await coaService.getAccountHierarchy(req.query as any, requestingUserId);

            successResponse(res, hierarchy, 'Hierarki akun berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update account
     * PUT /api/v1/coa/:id
     */
    async updateAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const account = await coaService.updateAccount(req.params.id, req.body, requestingUserId);

            successResponse(res, account, 'Akun berhasil diupdate');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update account balance
     * PUT /api/v1/coa/:id/balance
     */
    async updateAccountBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const account = await coaService.updateAccountBalance(
                req.params.id,
                req.body,
                requestingUserId
            );

            successResponse(res, account, 'Saldo akun berhasil diupdate');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete account
     * DELETE /api/v1/coa/:id
     */
    async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            await coaService.deleteAccount(req.params.id, requestingUserId);

            successResponse(res, null, 'Akun berhasil dihapus');
        } catch (error) {
            next(error);
        }
    }
}

// Export singleton instance
export const coaController = new CoaController();

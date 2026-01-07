import { Request, Response, NextFunction } from 'express';
import { customerService } from '@/services/customer.service';
import { successResponse, createdResponse } from '@/utils/response';

/**
 * Customer Controller
 * Handles HTTP requests for customer endpoints
 */
export class CustomerController {
    /**
     * Create customer
     * POST /api/v1/customers
     */
    async createCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const customer = await customerService.createCustomer(req.body, requestingUserId);

            createdResponse(res, customer, 'Pelanggan berhasil dibuat');
        } catch (error) {
            next(error);
        }
    }

    /**
     * List customers with pagination and filters
     * GET /api/v1/customers
     */
    async listCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const result = await customerService.listCustomers(req.query as any, requestingUserId);

            successResponse(res, result.data, 'Data pelanggan berhasil diambil', 200, result.meta);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get customer by ID
     * GET /api/v1/customers/:id
     */
    async getCustomerById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const customer = await customerService.getCustomerById(req.params.id, requestingUserId);

            successResponse(res, customer, 'Data pelanggan berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update customer
     * PUT /api/v1/customers/:id
     */
    async updateCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const customer = await customerService.updateCustomer(
                req.params.id,
                req.body,
                requestingUserId
            );

            successResponse(res, customer, 'Pelanggan berhasil diupdate');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get customer aging report
     * GET /api/v1/customers/aging
     */
    async getCustomerAging(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const aging = await customerService.getCustomerAging(req.query as any, requestingUserId);

            successResponse(res, aging, 'Customer aging berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Toggle customer status
     * PUT /api/v1/customers/:id/toggle-status
     */
    async toggleCustomerStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const customer = await customerService.toggleCustomerStatus(req.params.id, requestingUserId);

            successResponse(res, customer, 'Status pelanggan berhasil diubah');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete customer
     * DELETE /api/v1/customers/:id
     */
    async deleteCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            await customerService.deleteCustomer(req.params.id, requestingUserId);

            successResponse(res, null, 'Pelanggan berhasil dihapus');
        } catch (error) {
            next(error);
        }
    }
}

// Export singleton instance
export const customerController = new CustomerController();

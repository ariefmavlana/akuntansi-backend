import { Request, Response, NextFunction } from 'express';
import { supplierService } from '@/services/supplier.service';
import { successResponse, createdResponse } from '@/utils/response';

/**
 * Supplier Controller
 * Handles HTTP requests for supplier endpoints
 */
export class SupplierController {
    /**
     * Create supplier
     * POST /api/v1/suppliers
     */
    async createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const supplier = await supplierService.createSupplier(req.body, requestingUserId);

            createdResponse(res, supplier, 'Pemasok berhasil dibuat');
        } catch (error) {
            next(error);
        }
    }

    /**
     * List suppliers with pagination and filters
     * GET /api/v1/suppliers
     */
    async listSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const result = await supplierService.listSuppliers(req.query as any, requestingUserId);

            successResponse(res, result.data, 'Data pemasok berhasil diambil', 200, result.meta);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get supplier by ID
     * GET /api/v1/suppliers/:id
     */
    async getSupplierById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const supplier = await supplierService.getSupplierById(req.params.id, requestingUserId);

            successResponse(res, supplier, 'Data pemasok berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update supplier
     * PUT /api/v1/suppliers/:id
     */
    async updateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const supplier = await supplierService.updateSupplier(
                req.params.id,
                req.body,
                requestingUserId
            );

            successResponse(res, supplier, 'Pemasok berhasil diupdate');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get supplier aging report
     * GET /api/v1/suppliers/aging
     */
    async getSupplierAging(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const aging = await supplierService.getSupplierAging(req.query as any, requestingUserId);

            successResponse(res, aging, 'Supplier aging berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Toggle supplier status
     * PUT /api/v1/suppliers/:id/toggle-status
     */
    async toggleSupplierStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const supplier = await supplierService.toggleSupplierStatus(req.params.id, requestingUserId);

            successResponse(res, supplier, 'Status pemasok berhasil diubah');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete supplier
     * DELETE /api/v1/suppliers/:id
     */
    async deleteSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            await supplierService.deleteSupplier(req.params.id, requestingUserId);

            successResponse(res, null, 'Pemasok berhasil dihapus');
        } catch (error) {
            next(error);
        }
    }
}

// Export singleton instance
export const supplierController = new SupplierController();

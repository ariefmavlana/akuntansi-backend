import { Request, Response, NextFunction } from 'express';
import { voucherService } from '@/services/voucher.service';
import { successResponse, createdResponse } from '@/utils/response';

/**
 * Voucher Controller
 * Handles HTTP requests for voucher management endpoints
 */
export class VoucherController {
    /**
     * Create new voucher
     * POST /api/v1/vouchers
     */
    async createVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const voucher = await voucherService.createVoucher(req.body, requestingUserId);

            createdResponse(res, voucher, 'Voucher berhasil dibuat');
        } catch (error) {
            next(error);
        }
    }

    /**
     * List vouchers with pagination and filters
     * GET /api/v1/vouchers
     */
    async listVouchers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const result = await voucherService.listVouchers(req.query as any, requestingUserId);

            successResponse(res, result.data, 'Data voucher berhasil diambil', 200, result.meta);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get voucher by ID
     * GET /api/v1/vouchers/:id
     */
    async getVoucherById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const voucher = await voucherService.getVoucherById(req.params.id, requestingUserId);

            successResponse(res, voucher, 'Data voucher berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update voucher
     * PUT /api/v1/vouchers/:id
     */
    async updateVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const voucher = await voucherService.updateVoucher(
                req.params.id,
                req.body,
                requestingUserId
            );

            successResponse(res, voucher, 'Voucher berhasil diupdate');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Submit voucher for approval
     * POST /api/v1/vouchers/:id/submit
     */
    async submitForApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const voucher = await voucherService.submitForApproval(req.params.id, requestingUserId);

            successResponse(res, voucher, 'Voucher berhasil disubmit untuk approval');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Approve voucher
     * POST /api/v1/vouchers/:id/approve
     */
    async approveVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const voucher = await voucherService.approveVoucher(
                req.params.id,
                req.body,
                requestingUserId
            );

            successResponse(res, voucher, 'Voucher berhasil disetujui');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reject voucher
     * POST /api/v1/vouchers/:id/reject
     */
    async rejectVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const voucher = await voucherService.rejectVoucher(
                req.params.id,
                req.body,
                requestingUserId
            );

            successResponse(res, voucher, 'Voucher berhasil ditolak');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Post voucher to journal
     * POST /api/v1/vouchers/:id/post
     */
    async postVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const voucher = await voucherService.postVoucher(req.params.id, req.body, requestingUserId);

            successResponse(res, voucher, 'Voucher berhasil diposting');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reverse voucher
     * POST /api/v1/vouchers/:id/reverse
     */
    async reverseVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const voucher = await voucherService.reverseVoucher(
                req.params.id,
                req.body,
                requestingUserId
            );

            successResponse(res, voucher, 'Voucher berhasil direverse');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete voucher
     * DELETE /api/v1/vouchers/:id
     */
    async deleteVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            await voucherService.deleteVoucher(req.params.id, requestingUserId);

            successResponse(res, null, 'Voucher berhasil dihapus');
        } catch (error) {
            next(error);
        }
    }
}

// Export singleton instance
export const voucherController = new VoucherController();

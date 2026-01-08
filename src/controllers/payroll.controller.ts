import { Request, Response, NextFunction } from 'express';
import { payrollService } from '@/services/payroll.service';
import { successResponse, createdResponse } from '@/utils/response';

/**
 * Payroll Controller
 * Handles HTTP requests for payroll management endpoints
 */
export class PayrollController {
    /**
     * Create payroll (manual)
     * POST /api/v1/payrolls
     */
    async createPayroll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const payroll = await payrollService.createPayroll(req.body);
            createdResponse(res, payroll, 'Slip gaji berhasil dibuat');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Generate payroll (batch)
     * POST /api/v1/payrolls/generate
     */
    async generatePayroll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await payrollService.generatePayroll(req.body);
            createdResponse(res, result, `Berhasil generate ${result.count} data gaji`);
        } catch (error) {
            next(error);
        }
    }

    /**
     * List payrolls
     * GET /api/v1/payrolls
     */
    async listPayrolls(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await payrollService.listPayrolls(req.query as any);
            successResponse(res, result.data, 'Data gaji berhasil diambil', 200, result.meta);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get payroll by ID
     * GET /api/v1/payrolls/:id
     */
    async getPayrollById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const payroll = await payrollService.getPayrollById(req.params.id);
            if (!payroll) {
                res.status(404).json({ success: false, message: 'Data gaji tidak ditemukan' });
                return;
            }
            successResponse(res, payroll, 'Data gaji berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update payroll
     * PUT /api/v1/payrolls/:id
     */
    async updatePayroll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const payroll = await payrollService.updatePayroll(req.params.id, req.body);
            successResponse(res, payroll, 'Data gaji berhasil diupdate');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Pay payroll
     * POST /api/v1/payrolls/:id/pay
     */
    async payPayroll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const payroll = await payrollService.payPayroll(req.params.id, req.body, requestingUserId);
            successResponse(res, payroll, 'Gaji berhasil dibayar dan dijurnal');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete payroll
     * DELETE /api/v1/payrolls/:id
     */
    async deletePayroll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await payrollService.deletePayroll(req.params.id);
            successResponse(res, null, 'Data gaji berhasil dihapus');
        } catch (error) {
            next(error);
        }
    }
}

export const payrollController = new PayrollController();

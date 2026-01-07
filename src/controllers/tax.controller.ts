import { Request, Response, NextFunction } from 'express';
import { taxService } from '@/services/tax.service';
import { successResponse } from '@/utils/response';

export class TaxController {
    async calculatePPh21(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await taxService.calculatePPh21(req.body);
            successResponse(res, result, 'Perhitungan PPh 21 berhasil');
        } catch (error) {
            next(error);
        }
    }

    async calculatePPN(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await taxService.calculatePPN(req.body);
            successResponse(res, result, 'Perhitungan PPN berhasil');
        } catch (error) {
            next(error);
        }
    }

    async getTaxReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const requestingUserId = req.user!.userId;
            const report = await taxService.getTaxReport(req.query as any, requestingUserId);
            successResponse(res, report, 'Laporan pajak berhasil diambil');
        } catch (error) {
            next(error);
        }
    }
}

export const taxController = new TaxController();

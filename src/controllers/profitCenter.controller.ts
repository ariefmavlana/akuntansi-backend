import { Request, Response } from 'express';
import { profitCenterService } from '@/services/profitCenter.service';
import { successResponse } from '@/utils/response';
import type {
    CreateProfitCenterInput,
    UpdateProfitCenterInput,
    GetProfitCentersInput,
} from '@/validators/profitCenter.validator';

export class ProfitCenterController {
    async create(req: Request, res: Response) {
        const data = req.body as CreateProfitCenterInput;
        const result = await profitCenterService.createProfitCenter(data, req.user!.userId);
        return successResponse(res, result, 'Profit center berhasil dibuat', 201);
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        const data = req.body as UpdateProfitCenterInput;
        const result = await profitCenterService.updateProfitCenter(id, data, req.user!.userId);
        return successResponse(res, result, 'Profit center berhasil diupdate');
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        const result = await profitCenterService.deleteProfitCenter(id, req.user!.userId);
        return successResponse(res, result, 'Profit center berhasil dihapus');
    }

    async getAll(req: Request, res: Response) {
        const filters = req.query as unknown as GetProfitCentersInput;
        const result = await profitCenterService.getProfitCenters(filters, req.user!.userId);
        return successResponse(res, result, 'Profit centers berhasil diambil');
    }

    async getById(req: Request, res: Response) {
        const { id } = req.params;
        const result = await profitCenterService.getProfitCenterById(id, req.user!.userId);
        return successResponse(res, result, 'Profit center berhasil diambil');
    }

    async getPerformance(req: Request, res: Response) {
        const { id } = req.params;
        const { startDate, endDate } = req.query as any;
        const result = await profitCenterService.getProfitCenterPerformance(id, startDate, endDate);
        return successResponse(res, result, 'Performance profit center berhasil diambil');
    }
}

export const profitCenterController = new ProfitCenterController();

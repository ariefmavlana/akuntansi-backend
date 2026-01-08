import { Request, Response } from 'express';
import { costCenterService } from '@/services/costCenter.service';
import { successResponse } from '@/utils/response';
import type {
    CreateCostCenterInput,
    UpdateCostCenterInput,
    GetCostCentersInput,
} from '@/validators/costCenter.validator';

export class CostCenterController {
    async create(req: Request, res: Response) {
        const data = req.body as CreateCostCenterInput;
        const result = await costCenterService.createCostCenter(data, req.user!.userId);
        return successResponse(res, result, 'Cost center berhasil dibuat', 201);
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        const data = req.body as UpdateCostCenterInput;
        const result = await costCenterService.updateCostCenter(id, data, req.user!.userId);
        return successResponse(res, result, 'Cost center berhasil diupdate');
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        const result = await costCenterService.deleteCostCenter(id, req.user!.userId);
        return successResponse(res, result, 'Cost center berhasil dihapus');
    }

    async getAll(req: Request, res: Response) {
        const filters = req.query as unknown as GetCostCentersInput;
        const result = await costCenterService.getCostCenters(filters, req.user!.userId);
        return successResponse(res, result, 'Cost centers berhasil diambil');
    }

    async getById(req: Request, res: Response) {
        const { id } = req.params;
        const result = await costCenterService.getCostCenterById(id, req.user!.userId);
        return successResponse(res, result, 'Cost center berhasil diambil');
    }

    async getTransactions(req: Request, res: Response) {
        const { id } = req.params;
        const { startDate, endDate } = req.query as any;
        const result = await costCenterService.getCostCenterTransactions(id, startDate, endDate);
        return successResponse(res, result, 'Transaksi cost center berhasil diambil');
    }
}

export const costCenterController = new CostCenterController();

import { Request, Response } from 'express';
import { budgetService } from '@/services/budget.service';
import { successResponse } from '@/utils/response';
import type {
    CreateBudgetInput,
    UpdateBudgetInput,
    AddBudgetDetailInput,
    UpdateBudgetDetailInput,
    CreateBudgetRevisionInput,
    GetBudgetsInput,
} from '@/validators/budget.validator';

export class BudgetController {
    async create(req: Request, res: Response) {
        const data = req.body as CreateBudgetInput;
        const result = await budgetService.createBudget(data, req.user!.userId);
        return successResponse(res, result, 'Budget berhasil dibuat', 201);
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        const data = req.body as UpdateBudgetInput;
        const result = await budgetService.updateBudget(id, data, req.user!.userId);
        return successResponse(res, result, 'Budget berhasil diupdate');
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        const result = await budgetService.deleteBudget(id, req.user!.userId);
        return successResponse(res, result, 'Budget berhasil dihapus');
    }

    async approve(req: Request, res: Response) {
        const { id } = req.params;
        const result = await budgetService.approveBudget(id, req.user!.userId);
        return successResponse(res, result, 'Budget berhasil disetujui');
    }

    async activate(req: Request, res: Response) {
        const { id } = req.params;
        const result = await budgetService.activateBudget(id, req.user!.userId);
        return successResponse(res, result, 'Budget berhasil diaktifkan');
    }

    async close(req: Request, res: Response) {
        const { id } = req.params;
        const result = await budgetService.closeBudget(id, req.user!.userId);
        return successResponse(res, result, 'Budget berhasil ditutup');
    }

    async getAll(req: Request, res: Response) {
        const filters = req.query as unknown as GetBudgetsInput;
        const result = await budgetService.getBudgets(filters, req.user!.userId);
        return successResponse(res, result, 'Budgets berhasil diambil');
    }

    async getById(req: Request, res: Response) {
        const { id } = req.params;
        const result = await budgetService.getBudgetById(id, req.user!.userId);
        return successResponse(res, result, 'Budget berhasil diambil');
    }

    async addDetail(req: Request, res: Response) {
        const { id } = req.params;
        const data = req.body as AddBudgetDetailInput;
        const result = await budgetService.addBudgetDetail(id, data, req.user!.userId);
        return successResponse(res, result, 'Budget detail berhasil ditambahkan', 201);
    }

    async updateDetail(req: Request, res: Response) {
        const { id, detailId } = req.params;
        const data = req.body as UpdateBudgetDetailInput;
        const result = await budgetService.updateBudgetDetail(id, detailId, data, req.user!.userId);
        return successResponse(res, result, 'Budget detail berhasil diupdate');
    }

    async deleteDetail(req: Request, res: Response) {
        const { id, detailId } = req.params;
        const result = await budgetService.deleteBudgetDetail(id, detailId, req.user!.userId);
        return successResponse(res, result, 'Budget detail berhasil dihapus');
    }

    async createRevision(req: Request, res: Response) {
        const { id } = req.params;
        const data = req.body as CreateBudgetRevisionInput;
        const result = await budgetService.createBudgetRevision(id, data, req.user!.userId);
        return successResponse(res, result, 'Budget revision berhasil dibuat', 201);
    }

    async getBudgetVsActual(req: Request, res: Response) {
        const { id } = req.params;
        const { bulan } = req.query as any;
        const result = await budgetService.getBudgetVsActual(id, bulan ? parseInt(bulan) : undefined);
        return successResponse(res, result, 'Budget vs actual berhasil diambil');
    }
}

export const budgetController = new BudgetController();

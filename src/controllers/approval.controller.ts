import { Response } from 'express';
import { approvalService } from '@/services/approval.service';
import { successResponse } from '@/utils/response';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';

export class ApprovalController {
    async createTemplate(req: AuthenticatedRequest, res: Response) {
        const result = await approvalService.createTemplate(req.body, req.user!.userId);
        return successResponse(res, result, 'Approval template berhasil dibuat', 201);
    }

    async submitForApproval(req: AuthenticatedRequest, res: Response) {
        const result = await approvalService.submitForApproval(req.body, req.user!.userId);
        return successResponse(res, result, 'Submitted for approval');
    }

    async processApproval(req: AuthenticatedRequest, res: Response) {
        const result = await approvalService.processApproval(req.params.id, req.body, req.user!.userId);
        return successResponse(res, result, 'Approval processed');
    }

    async getPendingApprovals(req: AuthenticatedRequest, res: Response) {
        const result = await approvalService.getPendingApprovals(req.user!.userId);
        return successResponse(res, result, 'Pending approvals');
    }

    async getApprovals(req: AuthenticatedRequest, res: Response) {
        const result = await approvalService.getApprovals(req.query as any, req.user!.userId);
        return successResponse(res, result, 'Approvals retrieved');
    }

    async getSummary(req: AuthenticatedRequest, res: Response) {
        const result = await approvalService.getSummary(req.user!.userId);
        return successResponse(res, result, 'Approval summary retrieved');
    }
}

export const approvalController = new ApprovalController();

import { Request, Response, NextFunction } from 'express';
import { auditService } from '@/services/audit.service';
import type {
    GetAuditLogsInput,
    GetAuditByRecordInput,
    GetUserActivityInput,
} from '@/validators/audit.validator';

export class AuditController {
    // Get all audit logs
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = req.query as unknown as GetAuditLogsInput;
            const result = await auditService.getAuditLogs(filters);

            return res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    // Get single audit log
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const auditLog = await auditService.getAuditLog(id);

            return res.json({
                success: true,
                data: auditLog,
            });
        } catch (error) {
            next(error);
        }
    }

    // Get audit logs for specific record
    async getByRecord(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = req.query as unknown as GetAuditByRecordInput;
            const result = await auditService.getAuditByRecord(filters);

            return res.json({
                success: true,
                data: result.data,
                total: result.total,
            });
        } catch (error) {
            next(error);
        }
    }

    // Get user activity
    async getUserActivity(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = req.params;
            const query = req.query as any;

            const params: GetUserActivityInput = {
                userId,
                startDate: query.startDate,
                endDate: query.endDate,
                page: query.page ? Number(query.page) : undefined,
                limit: query.limit ? Number(query.limit) : undefined,
            };

            const result = await auditService.getUserActivity(params);

            return res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
                statistics: result.statistics,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const auditController = new AuditController();

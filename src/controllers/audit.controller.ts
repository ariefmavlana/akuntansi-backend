import { Response, NextFunction } from 'express';
import { auditService } from '@/services/audit.service';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';

export class AuditController {
    // Get all audit logs
    async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { page, limit, modul, aksi, search, startDate, endDate } = req.query;

            const result = await auditService.getAuditLogs(req.user!.perusahaanId, {
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 20,
                module: modul as string,
                action: aksi as string,
                userName: search as string,
                startDate: startDate ? new Date(startDate as string) : undefined,
                endDate: endDate ? new Date(endDate as string) : undefined,
            });

            return res.json({
                status: 'success',
                data: result.data,
                meta: result.meta
            });
        } catch (error) {
            next(error); // Global error handler
        }
    }

    // Get single audit log
    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const auditLog = await auditService.getAuditLog(id);

            if (!auditLog) {
                return res.status(404).json({ status: 'error', message: 'Log not found' });
            }

            return res.json({
                status: 'success',
                data: auditLog,
            });
        } catch (error) {
            next(error);
        }
    }

    // Get audit logs for specific record
    async getByRecord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { table, id } = req.params; // /records/:table/:id
            // Note: Route params might need adjustment based on route definition
            // Assuming route is /records/:table/:id

            const logs = await auditService.getAuditByRecord(
                req.user!.perusahaanId,
                table,
                id
            );

            return res.json({
                status: 'success',
                data: logs
            });
        } catch (error) {
            next(error);
        }
    }

    // Get user activity
    async getUserActivity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { userId } = req.params;
            // Security check: only view own activity or Admin
            if (userId !== req.user!.userId && !req.user!.role.includes('ADMIN')) {
                return res.status(403).json({ status: 'error', message: 'Forbidden' });
            }

            const limit = req.query.limit ? Number(req.query.limit) : 10;

            const activities = await auditService.getUserActivity(userId, limit);

            return res.json({
                status: 'success',
                data: activities
            });
        } catch (error) {
            next(error);
        }
    }
}

export const auditController = new AuditController();

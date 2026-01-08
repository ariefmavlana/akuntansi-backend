import { Response } from 'express';
import { AuthenticatedRequest } from '@/middlewares/auth.middleware';
import { dashboardService } from '@/services/dashboard.service';
import logger from '@/utils/logger';

export class DashboardController {
    // Get Stats
    static async getStats(req: AuthenticatedRequest, res: Response) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const end = endDate ? new Date(endDate as string) : new Date();

            const stats = await dashboardService.getStats(req.user!.perusahaanId, start, end);

            res.json({
                status: 'success',
                data: stats
            });
        } catch (error: any) {
            logger.error('Error fetching dashboard stats:', error);
            res.status(500).json({ status: 'error', message: 'Failed to fetch stats' });
        }
    }

    // Get User Widgets
    static async getWidgets(req: AuthenticatedRequest, res: Response) {
        try {
            const widgets = await dashboardService.getUserWidgets(req.user!.userId, req.user!.perusahaanId);
            res.json({
                status: 'success',
                data: widgets
            });
        } catch (error: any) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    }

    // Add Widget
    static async createWidget(req: AuthenticatedRequest, res: Response) {
        try {
            const widget = await dashboardService.createWidget(
                req.user!.userId,
                req.user!.perusahaanId,
                req.body
            );
            res.status(201).json({
                status: 'success',
                data: widget
            });
        } catch (error: any) {
            res.status(400).json({ status: 'error', message: error.message });
        }
    }

    // Delete Widget
    static async deleteWidget(req: AuthenticatedRequest, res: Response) {
        try {
            await dashboardService.deleteWidget(req.params.id, req.user!.userId);
            res.json({
                status: 'success',
                message: 'Widget deleted'
            });
        } catch (error: any) {
            res.status(400).json({ status: 'error', message: error.message });
        }
    }
}

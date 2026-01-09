import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '@/services/dashboard.service';
import { successResponse } from '@/utils/response';

/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard stats and widgets
 */
export class DashboardController {
    /**
     * Get dashboard statistics
     * GET /api/v1/dashboard/stats
     */
    async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const end = endDate ? new Date(endDate as string) : new Date();

            const stats = await dashboardService.getStats(req.user!.perusahaanId, start, end);

            successResponse(res, stats, 'Dashboard statistics retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user widgets
     * GET /api/v1/dashboard/widgets
     */
    async getWidgets(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const widgets = await dashboardService.getUserWidgets(req.user!.userId, req.user!.perusahaanId);
            successResponse(res, widgets, 'User widgets retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Add new widget
     * POST /api/v1/dashboard/widgets
     */
    async createWidget(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const widget = await dashboardService.createWidget(
                req.user!.userId,
                req.user!.perusahaanId,
                req.body
            );
            successResponse(res, widget, 'Widget created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete widget
     * DELETE /api/v1/dashboard/widgets/:id
     */
    async deleteWidget(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await dashboardService.deleteWidget(req.params.id, req.user!.userId);
            successResponse(res, null, 'Widget deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

// Export singleton instance
export const dashboardController = new DashboardController();

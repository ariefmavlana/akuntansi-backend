"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
const logger_1 = __importDefault(require("../utils/logger"));
class DashboardController {
    // Get Stats
    static async getStats(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const end = endDate ? new Date(endDate) : new Date();
            const stats = await dashboard_service_1.dashboardService.getStats(req.user.perusahaanId, start, end);
            res.json({
                status: 'success',
                data: stats
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching dashboard stats:', error);
            res.status(500).json({ status: 'error', message: 'Failed to fetch stats' });
        }
    }
    // Get User Widgets
    static async getWidgets(req, res) {
        try {
            const widgets = await dashboard_service_1.dashboardService.getUserWidgets(req.user.userId, req.user.perusahaanId);
            res.json({
                status: 'success',
                data: widgets
            });
        }
        catch (error) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    }
    // Add Widget
    static async createWidget(req, res) {
        try {
            const widget = await dashboard_service_1.dashboardService.createWidget(req.user.userId, req.user.perusahaanId, req.body);
            res.status(201).json({
                status: 'success',
                data: widget
            });
        }
        catch (error) {
            res.status(400).json({ status: 'error', message: error.message });
        }
    }
    // Delete Widget
    static async deleteWidget(req, res) {
        try {
            await dashboard_service_1.dashboardService.deleteWidget(req.params.id, req.user.userId);
            res.json({
                status: 'success',
                message: 'Widget deleted'
            });
        }
        catch (error) {
            res.status(400).json({ status: 'error', message: error.message });
        }
    }
}
exports.DashboardController = DashboardController;

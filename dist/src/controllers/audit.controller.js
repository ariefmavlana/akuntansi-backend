"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditController = exports.AuditController = void 0;
const audit_service_1 = require("../services/audit.service");
class AuditController {
    // Get all audit logs
    async getAll(req, res, next) {
        try {
            const { page, limit, modul, aksi, search, startDate, endDate } = req.query;
            const result = await audit_service_1.auditService.getAuditLogs(req.user.perusahaanId, {
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 20,
                module: modul,
                action: aksi,
                userName: search,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            });
            return res.json({
                status: 'success',
                data: result.data,
                meta: result.meta
            });
        }
        catch (error) {
            next(error); // Global error handler
        }
    }
    // Get single audit log
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const auditLog = await audit_service_1.auditService.getAuditLog(id);
            if (!auditLog) {
                return res.status(404).json({ status: 'error', message: 'Log not found' });
            }
            return res.json({
                status: 'success',
                data: auditLog,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Get audit logs for specific record
    async getByRecord(req, res, next) {
        try {
            const { table, id } = req.params; // /records/:table/:id
            // Note: Route params might need adjustment based on route definition
            // Assuming route is /records/:table/:id
            const logs = await audit_service_1.auditService.getAuditByRecord(req.user.perusahaanId, table, id);
            return res.json({
                status: 'success',
                data: logs
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Get user activity
    async getUserActivity(req, res, next) {
        try {
            const { userId } = req.params;
            // Security check: only view own activity or Admin
            if (userId !== req.user.userId && !req.user.role.includes('ADMIN')) {
                return res.status(403).json({ status: 'error', message: 'Forbidden' });
            }
            const limit = req.query.limit ? Number(req.query.limit) : 10;
            const activities = await audit_service_1.auditService.getUserActivity(userId, limit);
            return res.json({
                status: 'success',
                data: activities
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuditController = AuditController;
exports.auditController = new AuditController();

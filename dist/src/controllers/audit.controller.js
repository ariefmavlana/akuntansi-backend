"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditController = exports.AuditController = void 0;
const audit_service_1 = require("../services/audit.service");
class AuditController {
    // Get all audit logs
    async getAll(req, res, next) {
        try {
            const filters = req.query;
            const result = await audit_service_1.auditService.getAuditLogs(filters);
            return res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // Get single audit log
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const auditLog = await audit_service_1.auditService.getAuditLog(id);
            return res.json({
                success: true,
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
            const filters = req.query;
            const result = await audit_service_1.auditService.getAuditByRecord(filters);
            return res.json({
                success: true,
                data: result.data,
                total: result.total,
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
            const query = req.query;
            const params = {
                userId,
                startDate: query.startDate,
                endDate: query.endDate,
                page: query.page ? Number(query.page) : undefined,
                limit: query.limit ? Number(query.limit) : undefined,
            };
            const result = await audit_service_1.auditService.getUserActivity(params);
            return res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
                statistics: result.statistics,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuditController = AuditController;
exports.auditController = new AuditController();

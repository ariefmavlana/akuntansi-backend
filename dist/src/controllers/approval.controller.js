"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approvalController = exports.ApprovalController = void 0;
const approval_service_1 = require("../services/approval.service");
const response_1 = require("../utils/response");
class ApprovalController {
    async createTemplate(req, res) {
        const result = await approval_service_1.approvalService.createTemplate(req.body, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Approval template berhasil dibuat', 201);
    }
    async submitForApproval(req, res) {
        const result = await approval_service_1.approvalService.submitForApproval(req.body, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Submitted for approval');
    }
    async processApproval(req, res) {
        const result = await approval_service_1.approvalService.processApproval(req.params.id, req.body, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Approval processed');
    }
    async getPendingApprovals(req, res) {
        const result = await approval_service_1.approvalService.getPendingApprovals(req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Pending approvals');
    }
    async getApprovals(req, res) {
        const result = await approval_service_1.approvalService.getApprovals(req.query, req.user.userId);
        return (0, response_1.successResponse)(res, result, 'Approvals retrieved');
    }
}
exports.ApprovalController = ApprovalController;
exports.approvalController = new ApprovalController();

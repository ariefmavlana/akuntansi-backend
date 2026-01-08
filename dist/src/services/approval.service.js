"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.approvalService = exports.ApprovalService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const auth_service_1 = require("./auth.service");
class ApprovalService {
    // Create approval template
    async createTemplate(data, userId) {
        const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
        if (!user)
            throw new auth_service_1.AuthenticationError('User tidak ditemukan');
        return await database_1.default.approvalTemplate.create({
            data: {
                perusahaanId: user.perusahaanId,
                modul: data.modul,
                nama: data.nama,
                deskripsi: data.deskripsi,
                rules: data.rules || {},
                isDefault: data.isDefault || false,
                levels: {
                    create: data.levels.map((l) => ({
                        level: l.level,
                        nama: l.nama,
                        approverRoles: l.approverRoles,
                        minApprover: l.minApprover || 1,
                        isParalel: l.isParalel || false,
                        timeoutHari: l.timeoutHari,
                    })),
                },
            },
            include: { levels: true },
        });
    }
    // Submit for approval
    async submitForApproval(data, userId) {
        const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
        if (!user)
            throw new auth_service_1.AuthenticationError('User tidak ditemukan');
        // Find template
        const template = data.templateId
            ? await database_1.default.approvalTemplate.findUnique({
                where: { id: data.templateId },
                include: { levels: { orderBy: { level: 'asc' } } },
            })
            : await database_1.default.approvalTemplate.findFirst({
                where: {
                    perusahaanId: user.perusahaanId,
                    modul: data.modul,
                    isDefault: true,
                    isAktif: true,
                },
                include: { levels: { orderBy: { level: 'asc' } } },
            });
        if (!template)
            throw new auth_service_1.ValidationError('Approval template tidak ditemukan');
        // Create approval flows for first level
        const firstLevel = template.levels[0];
        const approvers = await database_1.default.pengguna.findMany({
            where: {
                perusahaanId: user.perusahaanId,
                role: { in: firstLevel.approverRoles },
            },
        });
        if (approvers.length < firstLevel.minApprover) {
            throw new auth_service_1.ValidationError('Approver tidak cukup untuk level pertama');
        }
        const flows = await Promise.all(approvers.slice(0, firstLevel.minApprover).map((approver) => database_1.default.approvalFlow.create({
            data: {
                modul: data.modul,
                recordId: data.recordId,
                level: firstLevel.level,
                approverId: approver.id,
                status: 'PENDING',
            },
        })));
        logger_1.default.info(`Approval submitted for ${data.modul}:${data.recordId}`);
        return { template, flows };
    }
    // Process approval (approve/reject)
    async processApproval(flowId, data, userId) {
        const flow = await database_1.default.approvalFlow.findUnique({ where: { id: flowId } });
        if (!flow)
            throw new auth_service_1.ValidationError('Approval flow tidak ditemukan');
        if (flow.approverId !== userId)
            throw new auth_service_1.ValidationError('Anda bukan approver untuk flow ini');
        if (flow.status !== 'PENDING')
            throw new auth_service_1.ValidationError('Approval sudah diproses');
        const status = data.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        const updated = await database_1.default.approvalFlow.update({
            where: { id: flowId },
            data: {
                status,
                tanggal: new Date(),
                catatan: data.catatan,
            },
        });
        // If rejected, reject all pending flows for this record
        if (status === 'REJECTED') {
            await database_1.default.approvalFlow.updateMany({
                where: {
                    modul: flow.modul,
                    recordId: flow.recordId,
                    status: 'PENDING',
                },
                data: { status: 'REJECTED' },
            });
        }
        // If approved, check if ready for next level
        if (status === 'APPROVED') {
            await this.checkAndAdvanceLevel(flow.modul, flow.recordId, flow.level);
        }
        return updated;
    }
    // Get pending approvals for user
    async getPendingApprovals(userId) {
        return await database_1.default.approvalFlow.findMany({
            where: {
                approverId: userId,
                status: 'PENDING',
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    // Check and advance to next level
    async checkAndAdvanceLevel(modul, recordId, currentLevel) {
        const currentLevelFlows = await database_1.default.approvalFlow.findMany({
            where: { modul, recordId, level: currentLevel },
        });
        const allApproved = currentLevelFlows.every((f) => f.status === 'APPROVED');
        if (!allApproved)
            return;
        // Find template and next level
        const templates = await database_1.default.approvalTemplate.findMany({
            where: { modul, isAktif: true },
            include: { levels: { orderBy: { level: 'asc' } } },
        });
        const template = templates[0];
        if (!template)
            return;
        const nextLevel = template.levels.find((l) => l.level > currentLevel);
        if (!nextLevel) {
            logger_1.default.info(`Approval completed for ${modul}:${recordId}`);
            return;
        }
        // Create flows for next level
        const approvers = await database_1.default.pengguna.findMany({
            where: { role: { in: nextLevel.approverRoles } },
        });
        await Promise.all(approvers.slice(0, nextLevel.minApprover).map((approver) => database_1.default.approvalFlow.create({
            data: {
                modul,
                recordId,
                level: nextLevel.level,
                approverId: approver.id,
                status: 'PENDING',
            },
        })));
    }
    // Get all approvals with filters
    async getApprovals(filters, userId) {
        const where = {};
        if (filters.status)
            where.status = filters.status;
        if (filters.modul)
            where.modul = filters.modul;
        if (filters.approverId)
            where.approverId = filters.approverId;
        return await database_1.default.approvalFlow.findMany({
            where,
            include: { approver: { select: { namaLengkap: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
}
exports.ApprovalService = ApprovalService;
exports.approvalService = new ApprovalService();

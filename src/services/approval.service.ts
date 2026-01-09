import prisma from '@/config/database';
import logger from '@/utils/logger';
import { AuthenticationError, ValidationError } from './auth.service';
import type {
    CreateApprovalTemplateInput,
    SubmitForApprovalInput,
    ProcessApprovalInput,
    GetApprovalsInput,
} from '@/validators/approval.validator';

export class ApprovalService {
    // Create approval template
    async createTemplate(data: CreateApprovalTemplateInput, userId: string) {
        const user = await prisma.pengguna.findUnique({ where: { id: userId } });
        if (!user) throw new AuthenticationError('User tidak ditemukan');

        return await prisma.approvalTemplate.create({
            data: {
                perusahaanId: user.perusahaanId!,
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
    async submitForApproval(data: SubmitForApprovalInput, userId: string) {
        const user = await prisma.pengguna.findUnique({ where: { id: userId } });
        if (!user) throw new AuthenticationError('User tidak ditemukan');

        // Find template
        const template = data.templateId
            ? await prisma.approvalTemplate.findUnique({
                where: { id: data.templateId },
                include: { levels: { orderBy: { level: 'asc' } } },
            })
            : await prisma.approvalTemplate.findFirst({
                where: {
                    perusahaanId: user.perusahaanId!,
                    modul: data.modul,
                    isDefault: true,
                    isAktif: true,
                },
                include: { levels: { orderBy: { level: 'asc' } } },
            });

        if (!template) throw new ValidationError('Approval template tidak ditemukan');

        // Create approval flows for first level
        const firstLevel = template.levels[0];
        const approvers = await prisma.pengguna.findMany({
            where: {
                perusahaanId: user.perusahaanId!,
                role: { in: firstLevel.approverRoles as any },
            },
        });

        if (approvers.length < firstLevel.minApprover) {
            throw new ValidationError('Approver tidak cukup untuk level pertama');
        }

        const flows = await Promise.all(
            approvers.slice(0, firstLevel.minApprover).map((approver) =>
                prisma.approvalFlow.create({
                    data: {
                        modul: data.modul,
                        recordId: data.recordId,
                        level: firstLevel.level,
                        approverId: approver.id,
                        status: 'PENDING',
                    },
                })
            )
        );

        logger.info(`Approval submitted for ${data.modul}:${data.recordId}`);
        return { template, flows };
    }

    // Process approval (approve/reject)
    async processApproval(flowId: string, data: ProcessApprovalInput, userId: string) {
        const flow = await prisma.approvalFlow.findUnique({ where: { id: flowId } });
        if (!flow) throw new ValidationError('Approval flow tidak ditemukan');
        if (flow.approverId !== userId) throw new ValidationError('Anda bukan approver untuk flow ini');
        if (flow.status !== 'PENDING') throw new ValidationError('Approval sudah diproses');

        const status = data.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

        const updated = await prisma.approvalFlow.update({
            where: { id: flowId },
            data: {
                status,
                tanggal: new Date(),
                catatan: data.catatan,
            },
        });

        // If rejected, reject all pending flows for this record
        if (status === 'REJECTED') {
            await prisma.approvalFlow.updateMany({
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
    async getPendingApprovals(userId: string) {
        return await prisma.approvalFlow.findMany({
            where: {
                approverId: userId,
                status: 'PENDING',
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Check and advance to next level
    private async checkAndAdvanceLevel(modul: string, recordId: string, currentLevel: number) {
        const currentLevelFlows = await prisma.approvalFlow.findMany({
            where: { modul, recordId, level: currentLevel },
        });

        const allApproved = currentLevelFlows.every((f) => f.status === 'APPROVED');
        if (!allApproved) return;

        // Find template and next level
        const templates = await prisma.approvalTemplate.findMany({
            where: { modul, isAktif: true },
            include: { levels: { orderBy: { level: 'asc' } } },
        });

        const template = templates[0];
        if (!template) return;

        const nextLevel = template.levels.find((l) => l.level > currentLevel);
        if (!nextLevel) {
            logger.info(`Approval completed for ${modul}:${recordId}`);
            return;
        }

        // Create flows for next level
        const approvers = await prisma.pengguna.findMany({
            where: { role: { in: nextLevel.approverRoles as any } },
        });

        await Promise.all(
            approvers.slice(0, nextLevel.minApprover).map((approver) =>
                prisma.approvalFlow.create({
                    data: {
                        modul,
                        recordId,
                        level: nextLevel.level,
                        approverId: approver.id,
                        status: 'PENDING',
                    },
                })
            )
        );
    }

    // Get all approvals with filters
    async getApprovals(filters: GetApprovalsInput, userId: string) {
        const where: any = {};
        if (filters.status) where.status = filters.status;
        if (filters.modul) where.modul = filters.modul;
        if (filters.approverId) where.approverId = filters.approverId;

        return await prisma.approvalFlow.findMany({
            where,
            include: { approver: { select: { namaLengkap: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Get approval summary statistics
    async getSummary(userId: string) {
        const user = await prisma.pengguna.findUnique({ where: { id: userId } });
        if (!user) throw new AuthenticationError('User tidak ditemukan');

        const [pending, approved, rejected] = await Promise.all([
            prisma.approvalFlow.count({
                where: {
                    status: 'PENDING',
                    approver: { perusahaanId: user.perusahaanId },
                },
            }),
            prisma.approvalFlow.count({
                where: {
                    status: 'APPROVED',
                    approver: { perusahaanId: user.perusahaanId },
                },
            }),
            prisma.approvalFlow.count({
                where: {
                    status: 'REJECTED',
                    approver: { perusahaanId: user.perusahaanId },
                },
            }),
        ]);

        return {
            pending,
            approved,
            rejected,
            total: pending + approved + rejected,
        };
    }
}

export const approvalService = new ApprovalService();

import prisma from '@/config/database';
import logger from '@/utils/logger';
import { ValidationError } from './auth.service';
import type {
    GetAuditLogsInput,
    GetAuditByRecordInput,
    GetUserActivityInput,
} from '@/validators/audit.validator';

export class AuditService {
    // Create audit log (called internally by other services)
    async createAuditLog(data: {
        perusahaanId: string;
        penggunaId?: string;
        aksi: string;
        modul: string;
        subModul?: string;
        namaTabel: string;
        idData: string;
        dataSebelum?: any;
        dataSesudah?: any;
        perubahan?: any;
        ipAddress?: string;
        userAgent?: string;
        lokasi?: string;
        keterangan?: string;
    }) {
        const auditLog = await prisma.jejakAudit.create({
            data: {
                perusahaanId: data.perusahaanId,
                penggunaId: data.penggunaId,
                aksi: data.aksi,
                modul: data.modul,
                subModul: data.subModul,
                namaTabel: data.namaTabel,
                idData: data.idData,
                dataSebelum: data.dataSebelum || null,
                dataSesudah: data.dataSesudah || null,
                perubahan: data.perubahan || null,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                lokasi: data.lokasi,
                keterangan: data.keterangan,
            },
        });

        logger.info(`Audit log created: ${data.aksi} on ${data.namaTabel}:${data.idData}`);
        return auditLog;
    }

    // Get audit logs with comprehensive filtering
    async getAuditLogs(filters: GetAuditLogsInput) {
        const where: any = { perusahaanId: filters.perusahaanId };

        if (filters.penggunaId) where.penggunaId = filters.penggunaId;
        if (filters.modul) where.modul = filters.modul;
        if (filters.subModul) where.subModul = filters.subModul;
        if (filters.aksi) where.aksi = filters.aksi;
        if (filters.namaTabel) where.namaTabel = filters.namaTabel;
        if (filters.idData) where.idData = filters.idData;

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
            if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
        }

        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.jejakAudit.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    pengguna: {
                        select: {
                            namaLengkap: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            }),
            prisma.jejakAudit.count({ where }),
        ]);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // Get single audit log
    async getAuditLog(id: string) {
        const auditLog = await prisma.jejakAudit.findUnique({
            where: { id },
            include: {
                pengguna: {
                    select: {
                        namaLengkap: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        if (!auditLog) throw new ValidationError('Audit log tidak ditemukan');
        return auditLog;
    }

    // Get audit logs for a specific record (history tracking)
    async getAuditByRecord(filters: GetAuditByRecordInput) {
        const logs = await prisma.jejakAudit.findMany({
            where: {
                namaTabel: filters.namaTabel,
                idData: filters.idData,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                pengguna: {
                    select: {
                        namaLengkap: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        return {
            data: logs,
            total: logs.length,
        };
    }

    // Get user activity timeline
    async getUserActivity(params: GetUserActivityInput) {
        const where: any = { penggunaId: params.userId };

        if (params.startDate || params.endDate) {
            where.createdAt = {};
            if (params.startDate) where.createdAt.gte = new Date(params.startDate);
            if (params.endDate) where.createdAt.lte = new Date(params.endDate);
        }

        const page = params.page || 1;
        const limit = params.limit || 50;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            prisma.jejakAudit.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.jejakAudit.count({ where }),
        ]);

        // Calculate activity statistics
        const stats = await prisma.jejakAudit.groupBy({
            by: ['aksi'],
            where,
            _count: {
                aksi: true,
            },
        });

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            statistics: {
                totalActions: total,
                byAction: stats.reduce((acc, stat) => {
                    acc[stat.aksi] = stat._count.aksi;
                    return acc;
                }, {} as Record<string, number>),
            },
        };
    }

    // Helper: Calculate diff between two objects
    calculateDiff(before: any, after: any): any {
        const diff: any = {};

        // Get all unique keys
        const allKeys = new Set([
            ...Object.keys(before || {}),
            ...Object.keys(after || {}),
        ]);

        allKeys.forEach((key) => {
            const beforeValue = before?.[key];
            const afterValue = after?.[key];

            if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
                diff[key] = {
                    from: beforeValue,
                    to: afterValue,
                };
            }
        });

        return diff;
    }
}

export const auditService = new AuditService();

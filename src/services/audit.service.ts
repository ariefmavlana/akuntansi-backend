import prisma from '@/config/database';
import logger from '@/utils/logger';

export interface AuditLogInput {
    perusahaanId: string;
    penggunaId?: string;
    aksi: string; // CREATE, UPDATE, DELETE, LOGIN, etc.
    modul: string;
    subModul?: string;
    namaTabel: string;
    idData: string;
    dataSebelum?: any;
    dataSesudah?: any;
    ipAddress?: string;
    userAgent?: string;
    keterangan?: string;
}

export class AuditService {
    /**
     * Log user activity to JejakAudit table.
     * designed to be "fire and forget" or awaited depending on critical nature.
     */
    async logActivity(data: AuditLogInput) {
        try {
            // Calculate diff if both before and after exist
            let perubahan: any = null;
            if (data.dataSebelum && data.dataSesudah) {
                perubahan = this.calculateDiff(data.dataSebelum, data.dataSesudah);
            }

            // Create log
            await prisma.jejakAudit.create({
                data: {
                    perusahaanId: data.perusahaanId,
                    penggunaId: data.penggunaId,
                    aksi: data.aksi,
                    modul: data.modul,
                    subModul: data.subModul,
                    namaTabel: data.namaTabel,
                    idData: data.idData,
                    dataSebelum: data.dataSebelum ?? undefined,
                    dataSesudah: data.dataSesudah ?? undefined,
                    perubahan: perubahan ?? undefined,
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                    keterangan: data.keterangan
                }
            });

            // Do not log success to console to stay quiet, only errors
        } catch (error) {
            // Fallback: Just log to file system if DB logging fails
            logger.error('Failed to write Audit Log:', error);
            logger.error('Audit Data:', JSON.stringify(data));
        }
    }

    /**
     * Get Audit Logs with pagination and filters
     */
    async getAuditLogs(perusahaanId: string, params: {
        page?: number;
        limit?: number;
        module?: string;
        action?: string;
        userName?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const page = Number(params.page) || 1;
        const limit = Number(params.limit) || 20;
        const skip = (page - 1) * limit;

        const where: any = { perusahaanId };

        if (params.module) where.modul = params.module;
        if (params.action) where.aksi = params.action;
        if (params.userName) {
            where.pengguna = { namaLengkap: { contains: params.userName, mode: 'insensitive' } };
        }
        if (params.startDate && params.endDate) {
            where.createdAt = { gte: params.startDate, lte: params.endDate };
        }

        const [total, logs] = await Promise.all([
            prisma.jejakAudit.count({ where }),
            prisma.jejakAudit.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { pengguna: { select: { namaLengkap: true, email: true } } }
            })
        ]);

        return {
            data: logs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get Single Audit Log
     */
    async getAuditLog(id: string) {
        return prisma.jejakAudit.findUnique({
            where: { id },
            include: { pengguna: { select: { namaLengkap: true, email: true } } }
        });
    }

    /**
     * Get Audit Logs for specific record
     */
    async getAuditByRecord(perusahaanId: string, table: string, idData: string) {
        return prisma.jejakAudit.findMany({
            where: { perusahaanId, namaTabel: table, idData },
            orderBy: { createdAt: 'desc' },
            include: { pengguna: { select: { namaLengkap: true } } }
        });
    }

    /**
     * Get User Activity
     */
    async getUserActivity(userId: string, limit = 10) {
        return prisma.jejakAudit.findMany({
            where: { penggunaId: userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }

    private calculateDiff(obj1: any, obj2: any) {
        // Simple shallow diff for now
        // In real world, use 'deep-diff' library or recursions
        const diff: any = {};
        const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

        allKeys.forEach(key => {
            if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
                diff[key] = {
                    old: obj1[key],
                    new: obj2[key]
                };
            }
        });
        return Object.keys(diff).length > 0 ? diff : null;
    }
}

export const auditService = new AuditService();

import prisma from '@/config/database';
import logger from '@/utils/logger';
import { Persediaan, Prisma } from '@prisma/client';
import type {
    CreateInventoryInput,
    StockMovementInput,
    ListInventoryInput,
} from '@/validators/inventory.validator';
import { AuthenticationError, ValidationError } from './auth.service';

/**
 * Inventory Service
 * Handles inventory tracking and stock movements using Prisma
 */
export class InventoryService {
    /**
     * Generate inventory code
     */
    private async generateInventoryCode(perusahaanId: string): Promise<string> {
        const count = await prisma.persediaan.count({
            where: { perusahaanId },
        });
        const sequence = String(count + 1).padStart(4, '0');
        return `INV-${sequence}`;
    }

    async createInventory(data: CreateInventoryInput, requestingUserId: string): Promise<Persediaan> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === data.perusahaanId;
            const canCreate = ['ADMIN', 'WAREHOUSE_MANAGER', 'PURCHASING'].includes(requestingUser.role);

            if (!isSuperAdmin && !(isOwnCompany && canCreate)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk membuat inventory');
            }

            const kodeBarang = data.kodeBarang || (await this.generateInventoryCode(data.perusahaanId));

            const inventory = await prisma.persediaan.create({
                data: {
                    perusahaanId: data.perusahaanId,
                    kodePersediaan: kodeBarang,
                    namaPersediaan: data.namaBarang,
                    kategori: data.kategori || 'UMUM',
                    satuan: data.satuan,
                    hargaBeli: data.hargaBeli,
                    hargaJual: data.hargaJual,
                    stokMinimum: data.stokMinimal,
                    supplierId: data.pemasokId,
                    deskripsi: data.keterangan,
                },
            });

            logger.info(`Inventory created: ${kodeBarang} by ${requestingUser.email}`);
            return inventory;
        } catch (error) {
            logger.error('Create inventory error:', error);
            throw error;
        }
    }

    async recordStockMovement(data: StockMovementInput, requestingUserId: string) {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const inventory = await prisma.persediaan.findUnique({
                where: { id: data.inventoryId },
            });

            if (!inventory) {
                throw new ValidationError('Inventory tidak ditemukan');
            }

            // For now, log the movement (full implementation would use MutasiPersediaan model)
            logger.info(`Stock movement: ${data.tipe} - ${data.jumlah} for ${inventory.kodePersediaan}`);

            return {
                message: 'Stock movement recorded',
                inventory,
                movement: data,
            };
        } catch (error) {
            logger.error('Record stock movement error:', error);
            throw error;
        }
    }

    async listInventory(filters: ListInventoryInput, requestingUserId: string) {
        try {
            const { page = 1, limit = 20, perusahaanId, kategori, search } = filters;

            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const where: Prisma.PersediaanWhereInput = {};

            if (requestingUser.role !== 'SUPERADMIN') {
                where.perusahaanId = requestingUser.perusahaanId;
            } else if (perusahaanId) {
                where.perusahaanId = perusahaanId;
            }

            if (kategori) {
                where.kategori = kategori;
            }

            if (search) {
                where.OR = [
                    { namaPersediaan: { contains: search, mode: 'insensitive' } },
                    { kodePersediaan: { contains: search, mode: 'insensitive' } },
                ];
            }

            const total = await prisma.persediaan.count({ where });

            const items = await prisma.persediaan.findMany({
                where,
                select: {
                    id: true,
                    kodePersediaan: true,
                    namaPersediaan: true,
                    kategori: true,
                    satuan: true,
                    hargaBeli: true,
                    hargaJual: true,
                    stokMinimum: true,
                    status: true,
                    createdAt: true,
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { namaPersediaan: 'asc' },
            });

            return {
                data: items,
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('List inventory error:', error);
            throw error;
        }
    }

    async getInventoryById(id: string, requestingUserId: string): Promise<Persediaan> {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            const inventory = await prisma.persediaan.findUnique({
                where: { id },
                include: {
                    supplier: {
                        select: {
                            nama: true,
                            kodePemasok: true,
                        },
                    },
                },
            });

            if (!inventory) {
                throw new ValidationError('Inventory tidak ditemukan');
            }

            if (
                requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== inventory.perusahaanId
            ) {
                throw new AuthenticationError('Anda tidak memiliki akses ke inventory ini');
            }

            return inventory;
        } catch (error) {
            logger.error('Get inventory by ID error:', error);
            throw error;
        }
    }
}

export const inventoryService = new InventoryService();

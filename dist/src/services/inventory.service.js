"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryService = exports.InventoryService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const auth_service_1 = require("./auth.service");
/**
 * Inventory Service
 * Handles inventory tracking and stock movements using Prisma
 */
class InventoryService {
    /**
     * Generate inventory code
     */
    async generateInventoryCode(perusahaanId) {
        const count = await database_1.default.persediaan.count({
            where: { perusahaanId },
        });
        const sequence = String(count + 1).padStart(4, '0');
        return `INV-${sequence}`;
    }
    async createInventory(data, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === data.perusahaanId;
            const canCreate = ['ADMIN', 'WAREHOUSE_MANAGER', 'PURCHASING'].includes(requestingUser.role);
            if (!isSuperAdmin && !(isOwnCompany && canCreate)) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses untuk membuat inventory');
            }
            const kodeBarang = data.kodeBarang || (await this.generateInventoryCode(data.perusahaanId));
            const inventory = await database_1.default.persediaan.create({
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
            logger_1.default.info(`Inventory created: ${kodeBarang} by ${requestingUser.email}`);
            return inventory;
        }
        catch (error) {
            logger_1.default.error('Create inventory error:', error);
            throw error;
        }
    }
    async recordStockMovement(data, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const inventory = await database_1.default.persediaan.findUnique({
                where: { id: data.inventoryId },
            });
            if (!inventory) {
                throw new auth_service_1.ValidationError('Inventory tidak ditemukan');
            }
            // For now, log the movement (full implementation would use MutasiPersediaan model)
            logger_1.default.info(`Stock movement: ${data.tipe} - ${data.jumlah} for ${inventory.kodePersediaan}`);
            return {
                message: 'Stock movement recorded',
                inventory,
                movement: data,
            };
        }
        catch (error) {
            logger_1.default.error('Record stock movement error:', error);
            throw error;
        }
    }
    async listInventory(filters, requestingUserId) {
        try {
            const { page = 1, limit = 20, perusahaanId, kategori, search } = filters;
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const where = {};
            if (requestingUser.role !== 'SUPERADMIN') {
                where.perusahaanId = requestingUser.perusahaanId;
            }
            else if (perusahaanId) {
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
            const total = await database_1.default.persediaan.count({ where });
            const items = await database_1.default.persediaan.findMany({
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
        }
        catch (error) {
            logger_1.default.error('List inventory error:', error);
            throw error;
        }
    }
    async getInventoryById(id, requestingUserId) {
        try {
            const requestingUser = await database_1.default.pengguna.findUnique({
                where: { id: requestingUserId },
            });
            if (!requestingUser) {
                throw new auth_service_1.AuthenticationError('User tidak ditemukan');
            }
            const inventory = await database_1.default.persediaan.findUnique({
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
                throw new auth_service_1.ValidationError('Inventory tidak ditemukan');
            }
            if (requestingUser.role !== 'SUPERADMIN' &&
                requestingUser.perusahaanId !== inventory.perusahaanId) {
                throw new auth_service_1.AuthenticationError('Anda tidak memiliki akses ke inventory ini');
            }
            return inventory;
        }
        catch (error) {
            logger_1.default.error('Get inventory by ID error:', error);
            throw error;
        }
    }
}
exports.InventoryService = InventoryService;
exports.inventoryService = new InventoryService();

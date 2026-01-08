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
            // 1. Resolve Warehouse (Gudang)
            let gudangId = data.gudangId;
            if (!gudangId) {
                // Find default warehouse for the company (via first branch)
                const defaultWarehouse = await database_1.default.gudang.findFirst({
                    where: { cabang: { perusahaanId: requestingUser.perusahaanId } }
                });
                if (defaultWarehouse) {
                    gudangId = defaultWarehouse.id;
                }
                else {
                    // Create default branch & warehouse if absolutely none exist (auto-setup)
                    // Simplified: Throw error for now to enforce setup, or create simple one.
                    // Better to create a default one for smoother UX.
                    const mainBranch = await database_1.default.cabang.findFirst({
                        where: { perusahaanId: requestingUser.perusahaanId }
                    });
                    let branchId = mainBranch?.id;
                    if (!branchId) {
                        const newBranch = await database_1.default.cabang.create({
                            data: {
                                perusahaanId: requestingUser.perusahaanId,
                                nama: 'Kantor Pusat (Default)',
                                kode: 'HQ',
                                alamat: 'Default Address'
                            }
                        });
                        branchId = newBranch.id;
                    }
                    const newWarehouse = await database_1.default.gudang.create({
                        data: {
                            cabangId: branchId,
                            nama: 'Gudang Utama',
                            kode: 'WH-MAIN'
                        }
                    });
                    gudangId = newWarehouse.id;
                }
            }
            // 2. Get/Create Stock Record
            let stockRecord = await database_1.default.stokPersediaan.findUnique({
                where: {
                    persediaanId_gudangId: {
                        persediaanId: inventory.id,
                        gudangId: gudangId
                    }
                }
            });
            if (!stockRecord) {
                stockRecord = await database_1.default.stokPersediaan.create({
                    data: {
                        persediaanId: inventory.id,
                        gudangId: gudangId,
                        kuantitas: 0,
                        hargaRataRata: inventory.hargaBeli, // Init with master price
                        nilaiStok: 0
                    }
                });
            }
            // 3. Process Movement
            let newQty = Number(stockRecord.kuantitas);
            let newAvgCost = Number(stockRecord.hargaRataRata);
            const movementQty = data.jumlah;
            const inputPrice = data.harga ? data.harga : newAvgCost;
            if (data.tipe === 'MASUK' || data.tipe === 'PENYESUAIAN') {
                // Calculate Average Cost (Weighted Average)
                const currentVal = newQty * newAvgCost;
                const incomingVal = movementQty * inputPrice;
                newQty += movementQty;
                if (newQty > 0) {
                    newAvgCost = (currentVal + incomingVal) / newQty;
                }
            }
            else if (data.tipe === 'KELUAR') {
                if (newQty < movementQty) {
                    throw new auth_service_1.ValidationError(`Stok tidak mencukupi. Tersedia: ${newQty}, Diminta: ${movementQty}`);
                }
                newQty -= movementQty;
                // Avg Cost doesn't change on OUT
            }
            // 4. Update Stock
            const updatedStock = await database_1.default.stokPersediaan.update({
                where: { id: stockRecord.id },
                data: {
                    kuantitas: newQty,
                    hargaRataRata: newAvgCost,
                    nilaiStok: newQty * newAvgCost
                }
            });
            // Update Master Data cache (optional, but good for quick view)
            await database_1.default.persediaan.update({
                where: { id: inventory.id },
                data: {
                    hargaBeli: newAvgCost // Sync master price to latest avg
                }
            });
            // 5. Create Mutation Record (Usage history)
            const mutasi = await database_1.default.mutasiPersediaan.create({
                data: {
                    persediaanId: inventory.id,
                    gudangId: gudangId,
                    nomorMutasi: `MUT-${Date.now()}`, // Simple ID
                    tanggal: new Date(),
                    tipe: data.tipe,
                    kuantitas: movementQty,
                    harga: inputPrice,
                    nilai: movementQty * inputPrice,
                    saldoSebelum: stockRecord.kuantitas,
                    saldoSesudah: newQty,
                    keterangan: data.keterangan || '-',
                    referensi: data.referensi
                }
            });
            logger_1.default.info(`Stock movement recorded: ${data.tipe} ${movementQty} for ${inventory.kodePersediaan} at Gudang ${gudangId}`);
            return {
                message: 'Stock movement recorded successfully',
                inventory: { ...inventory, stok: newQty, hargaRataRata: newAvgCost },
                stockRecord: updatedStock,
                mutasiData: mutasi
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

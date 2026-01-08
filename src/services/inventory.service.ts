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

            // 1. Resolve Warehouse (Gudang)
            let gudangId = data.gudangId;
            if (!gudangId) {
                // Find default warehouse for the company (via first branch)
                const defaultWarehouse = await prisma.gudang.findFirst({
                    where: { cabang: { perusahaanId: requestingUser.perusahaanId } }
                });

                if (defaultWarehouse) {
                    gudangId = defaultWarehouse.id;
                } else {
                    // Create default branch & warehouse if absolutely none exist (auto-setup)
                    // Simplified: Throw error for now to enforce setup, or create simple one.
                    // Better to create a default one for smoother UX.
                    const mainBranch = await prisma.cabang.findFirst({
                        where: { perusahaanId: requestingUser.perusahaanId }
                    });

                    let branchId = mainBranch?.id;
                    if (!branchId) {
                        const newBranch = await prisma.cabang.create({
                            data: {
                                perusahaanId: requestingUser.perusahaanId,
                                nama: 'Kantor Pusat (Default)',
                                kode: 'HQ',
                                alamat: 'Default Address'
                            }
                        });
                        branchId = newBranch.id;
                    }

                    const newWarehouse = await prisma.gudang.create({
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
            let stockRecord = await prisma.stokPersediaan.findUnique({
                where: {
                    persediaanId_gudangId: {
                        persediaanId: inventory.id,
                        gudangId: gudangId
                    }
                }
            });

            if (!stockRecord) {
                stockRecord = await prisma.stokPersediaan.create({
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
            } else if (data.tipe === 'KELUAR') {
                if (newQty < movementQty) {
                    throw new ValidationError(`Stok tidak mencukupi. Tersedia: ${newQty}, Diminta: ${movementQty}`);
                }
                newQty -= movementQty;
                // Avg Cost doesn't change on OUT
            }

            // 4. Update Stock
            const updatedStock = await prisma.stokPersediaan.update({
                where: { id: stockRecord.id },
                data: {
                    kuantitas: newQty,
                    hargaRataRata: newAvgCost,
                    nilaiStok: newQty * newAvgCost
                }
            });

            // Update Master Data cache (optional, but good for quick view)
            await prisma.persediaan.update({
                where: { id: inventory.id },
                data: {
                    hargaBeli: newAvgCost // Sync master price to latest avg
                }
            });

            // 5. Create Mutation Record (Usage history)
            const mutasi = await prisma.mutasiPersediaan.create({
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

            logger.info(`Stock movement recorded: ${data.tipe} ${movementQty} for ${inventory.kodePersediaan} at Gudang ${gudangId}`);

            return {
                message: 'Stock movement recorded successfully',
                inventory: { ...inventory, stok: newQty, hargaRataRata: newAvgCost },
                stockRecord: updatedStock,
                mutasiData: mutasi
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

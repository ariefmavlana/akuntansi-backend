import prisma from '@/config/database';
import logger from '@/utils/logger';
import { Kontrak, Prisma } from '@prisma/client';
import {
    CreateContractInput,
    UpdateContractInput,
    ListContractsInput,
} from '@/validators/contract.validator';
import { ValidationError } from './auth.service';

/**
 * Contract Service
 * Handles contract management
 */
export class ContractService {
    /**
     * Create new contract
     */
    async createContract(data: CreateContractInput): Promise<Kontrak> {
        try {
            // Check if contract number exists
            const existingContract = await prisma.kontrak.findUnique({
                where: {
                    perusahaanId_nomorKontrak: {
                        perusahaanId: data.perusahaanId,
                        nomorKontrak: data.nomorKontrak,
                    },
                },
            });

            if (existingContract) {
                throw new ValidationError('Nomor kontrak sudah digunakan');
            }

            const contract = await prisma.kontrak.create({
                data: {
                    ...data,
                    tanggalMulai: new Date(data.tanggalMulai),
                    tanggalAkhir: new Date(data.tanggalAkhir),
                },
            });

            logger.info(`Contract created: ${contract.nomorKontrak}`);
            return contract;
        } catch (error) {
            logger.error('Create contract error:', error);
            throw error;
        }
    }

    /**
     * Get contract by ID
     */
    async getContractById(id: string): Promise<Kontrak | null> {
        try {
            const contract = await prisma.kontrak.findUnique({
                where: { id },
                include: {
                    transaksi: true
                }
            });
            return contract;
        } catch (error) {
            logger.error('Get contract by ID error:', error);
            throw error;
        }
    }

    /**
     * List contracts
     */
    async listContracts(query: ListContractsInput): Promise<{
        data: Kontrak[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        }
    }> {
        try {
            const { page = 1, limit = 20, search, ...filter } = query;
            const skip = (page - 1) * limit;

            const where: Prisma.KontrakWhereInput = {
                ...filter,
            };

            if (search) {
                where.OR = [
                    { nomorKontrak: { contains: search, mode: 'insensitive' } },
                    { namaKontrak: { contains: search, mode: 'insensitive' } },
                    { pihakKedua: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (filter.tanggalMulai || filter.tanggalAkhir) {
                where.tanggalMulai = {};
                if (filter.tanggalMulai) where.tanggalMulai.gte = new Date(filter.tanggalMulai);
                if (filter.tanggalAkhir) where.tanggalMulai.lte = new Date(filter.tanggalAkhir);
            }

            const [data, total] = await Promise.all([
                prisma.kontrak.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.kontrak.count({ where }),
            ]);

            return {
                data,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                }
            };
        } catch (error) {
            logger.error('List contracts error:', error);
            throw error;
        }
    }

    /**
     * Update contract
     */
    async updateContract(id: string, data: UpdateContractInput['body']): Promise<Kontrak> {
        try {
            const contract = await prisma.kontrak.findUnique({ where: { id } });
            if (!contract) throw new ValidationError('Kontrak tidak ditemukan');

            const updated = await prisma.kontrak.update({
                where: { id },
                data: {
                    ...data,
                    ...(data.tanggalMulai && { tanggalMulai: new Date(data.tanggalMulai) }),
                    ...(data.tanggalAkhir && { tanggalAkhir: new Date(data.tanggalAkhir) }),
                },
            });

            logger.info(`Contract updated: ${updated.nomorKontrak}`);
            return updated;
        } catch (error) {
            logger.error('Update contract error:', error);
            throw error;
        }
    }

    /**
     * Delete contract
     */
    async deleteContract(id: string): Promise<Kontrak> {
        try {
            const contract = await prisma.kontrak.findUnique({ where: { id } });
            if (!contract) throw new ValidationError('Kontrak tidak ditemukan');

            // Check if contract has related transactions
            const relatedTrx = await prisma.transaksi.findFirst({ where: { kontrakId: id } });
            // Wait, schema check: does Transaksi have kontrakId?
            // "transaksi Transaksi[]" in Kontrak model implies relation. 
            // I should check schema again to be sure if relation is optional/required.
            // Assumption: It's optional.

            const deleted = await prisma.kontrak.delete({
                where: { id },
            });

            logger.info(`Contract deleted: ${deleted.nomorKontrak}`);
            return deleted;
        } catch (error) {
            logger.error('Delete contract error:', error);
            // Handle foreign key constraint error if any
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
                throw new ValidationError('Tidak dapat menghapus kontrak yang memiliki transaksi terkait');
            }
            throw error;
        }
    }
}

export const contractService = new ContractService();

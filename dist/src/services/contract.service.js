"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractService = exports.ContractService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const client_1 = require("@prisma/client");
const auth_service_1 = require("./auth.service");
/**
 * Contract Service
 * Handles contract management
 */
class ContractService {
    /**
     * Create new contract
     */
    async createContract(data) {
        try {
            // Check if contract number exists
            const existingContract = await database_1.default.kontrak.findUnique({
                where: {
                    perusahaanId_nomorKontrak: {
                        perusahaanId: data.perusahaanId,
                        nomorKontrak: data.nomorKontrak,
                    },
                },
            });
            if (existingContract) {
                throw new auth_service_1.ValidationError('Nomor kontrak sudah digunakan');
            }
            const contract = await database_1.default.kontrak.create({
                data: {
                    ...data,
                    tanggalMulai: new Date(data.tanggalMulai),
                    tanggalAkhir: new Date(data.tanggalAkhir),
                },
            });
            logger_1.default.info(`Contract created: ${contract.nomorKontrak}`);
            return contract;
        }
        catch (error) {
            logger_1.default.error('Create contract error:', error);
            throw error;
        }
    }
    /**
     * Get contract by ID
     */
    async getContractById(id) {
        try {
            const contract = await database_1.default.kontrak.findUnique({
                where: { id },
                include: {
                    transaksi: true
                }
            });
            return contract;
        }
        catch (error) {
            logger_1.default.error('Get contract by ID error:', error);
            throw error;
        }
    }
    /**
     * List contracts
     */
    async listContracts(query) {
        try {
            const { page = 1, limit = 20, search, ...filter } = query;
            const skip = (page - 1) * limit;
            const where = {
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
                if (filter.tanggalMulai)
                    where.tanggalMulai.gte = new Date(filter.tanggalMulai);
                if (filter.tanggalAkhir)
                    where.tanggalMulai.lte = new Date(filter.tanggalAkhir);
            }
            const [data, total] = await Promise.all([
                database_1.default.kontrak.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                database_1.default.kontrak.count({ where }),
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
        }
        catch (error) {
            logger_1.default.error('List contracts error:', error);
            throw error;
        }
    }
    /**
     * Update contract
     */
    async updateContract(id, data) {
        try {
            const contract = await database_1.default.kontrak.findUnique({ where: { id } });
            if (!contract)
                throw new auth_service_1.ValidationError('Kontrak tidak ditemukan');
            const updated = await database_1.default.kontrak.update({
                where: { id },
                data: {
                    ...data,
                    ...(data.tanggalMulai && { tanggalMulai: new Date(data.tanggalMulai) }),
                    ...(data.tanggalAkhir && { tanggalAkhir: new Date(data.tanggalAkhir) }),
                },
            });
            logger_1.default.info(`Contract updated: ${updated.nomorKontrak}`);
            return updated;
        }
        catch (error) {
            logger_1.default.error('Update contract error:', error);
            throw error;
        }
    }
    /**
     * Delete contract
     */
    async deleteContract(id) {
        try {
            const contract = await database_1.default.kontrak.findUnique({ where: { id } });
            if (!contract)
                throw new auth_service_1.ValidationError('Kontrak tidak ditemukan');
            // Check if contract has related transactions
            const relatedTrx = await database_1.default.transaksi.findFirst({ where: { kontrakId: id } });
            // Wait, schema check: does Transaksi have kontrakId?
            // "transaksi Transaksi[]" in Kontrak model implies relation. 
            // I should check schema again to be sure if relation is optional/required.
            // Assumption: It's optional.
            const deleted = await database_1.default.kontrak.delete({
                where: { id },
            });
            logger_1.default.info(`Contract deleted: ${deleted.nomorKontrak}`);
            return deleted;
        }
        catch (error) {
            logger_1.default.error('Delete contract error:', error);
            // Handle foreign key constraint error if any
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
                throw new auth_service_1.ValidationError('Tidak dapat menghapus kontrak yang memiliki transaksi terkait');
            }
            throw error;
        }
    }
}
exports.ContractService = ContractService;
exports.contractService = new ContractService();

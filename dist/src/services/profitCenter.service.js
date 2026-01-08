"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profitCenterService = exports.ProfitCenterService = void 0;
const database_1 = __importDefault(require("../config/database"));
const auth_service_1 = require("./auth.service");
class ProfitCenterService {
    async createProfitCenter(data, userId) {
        const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
        if (!user)
            throw new auth_service_1.AuthenticationError('User tidak ditemukan');
        const existing = await database_1.default.profitCenter.findUnique({
            where: { perusahaanId_kode: { perusahaanId: user.perusahaanId, kode: data.kode } },
        });
        if (existing)
            throw new auth_service_1.ValidationError('Kode profit center sudah digunakan');
        return await database_1.default.profitCenter.create({
            data: { ...data, perusahaanId: user.perusahaanId },
        });
    }
    async updateProfitCenter(id, data, userId) {
        const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
        if (!user)
            throw new auth_service_1.AuthenticationError('User tidak ditemukan');
        return await database_1.default.profitCenter.update({ where: { id }, data });
    }
    async deleteProfitCenter(id, userId) {
        const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
        if (!user)
            throw new auth_service_1.AuthenticationError('User tidak ditemukan');
        await database_1.default.profitCenter.update({ where: { id }, data: { isAktif: false } });
        return { message: 'Profit center berhasil dihapus' };
    }
    async getProfitCenters(filters, userId) {
        const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
        if (!user)
            throw new auth_service_1.AuthenticationError('User tidak ditemukan');
        const where = {
            perusahaanId: user.role === 'SUPERADMIN' ? filters.perusahaanId : user.perusahaanId,
            ...(filters.isAktif !== undefined && { isAktif: filters.isAktif }),
            ...(filters.search && {
                OR: [
                    { kode: { contains: filters.search, mode: 'insensitive' } },
                    { nama: { contains: filters.search, mode: 'insensitive' } },
                ],
            }),
        };
        return await database_1.default.profitCenter.findMany({
            where,
            include: { parent: true, children: true },
            orderBy: { kode: 'asc' },
        });
    }
    async getProfitCenterById(id, userId) {
        const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
        if (!user)
            throw new auth_service_1.AuthenticationError('User tidak ditemukan');
        const profitCenter = await database_1.default.profitCenter.findUnique({
            where: { id },
            include: { parent: true, children: true },
        });
        if (!profitCenter)
            throw new auth_service_1.ValidationError('Profit center tidak ditemukan');
        return profitCenter;
    }
    async getProfitCenterPerformance(id, startDate, endDate) {
        const profitCenter = await database_1.default.profitCenter.findUnique({ where: { id } });
        if (!profitCenter)
            throw new auth_service_1.ValidationError('Profit center tidak ditemukan');
        const where = {
            profitCenterId: id,
            ...(startDate && endDate && {
                tanggal: { gte: new Date(startDate), lte: new Date(endDate) },
            }),
        };
        const transactions = await database_1.default.transaksi.findMany({
            where,
            include: { detail: true },
            orderBy: { tanggal: 'desc' },
        });
        const totalRevenue = transactions
            .filter((t) => t.tipe === 'PENJUALAN')
            .reduce((sum, t) => sum + t.total.toNumber(), 0);
        return {
            profitCenter,
            transactions,
            summary: {
                totalTransactions: transactions.length,
                totalRevenue,
            },
        };
    }
}
exports.ProfitCenterService = ProfitCenterService;
exports.profitCenterService = new ProfitCenterService();

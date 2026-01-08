"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetService = exports.BudgetService = void 0;
const database_1 = __importDefault(require("../config/database"));
const auth_service_1 = require("./auth.service");
class BudgetService {
    async createBudget(data, userId) {
        const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
        if (!user)
            throw new auth_service_1.AuthenticationError('User tidak ditemukan');
        const existing = await database_1.default.budget.findUnique({
            where: { perusahaanId_kode: { perusahaanId: user.perusahaanId, kode: data.kode } },
        });
        if (existing)
            throw new auth_service_1.ValidationError('Kode budget sudah digunakan');
        const totalBudget = data.details.reduce((sum, d) => sum + d.jumlahBudget, 0);
        return await database_1.default.budget.create({
            data: {
                kode: data.kode,
                nama: data.nama,
                tahun: data.tahun,
                tipe: data.tipe,
                tanggalMulai: new Date(data.tanggalMulai),
                tanggalAkhir: new Date(data.tanggalAkhir),
                totalBudget,
                departemen: data.departemen,
                projectCode: data.projectCode,
                deskripsi: data.deskripsi,
                perusahaanId: user.perusahaanId,
                detail: {
                    create: data.details.map((d) => ({
                        akunId: d.akunId,
                        bulan: d.bulan,
                        periode: new Date(d.periode),
                        jumlahBudget: d.jumlahBudget,
                        keterangan: d.keterangan,
                    })),
                },
            },
            include: { detail: { include: { akun: true } } },
        });
    }
    async updateBudget(id, data, userId) {
        const budget = await database_1.default.budget.findUnique({ where: { id } });
        if (!budget)
            throw new auth_service_1.ValidationError('Budget tidak ditemukan');
        if (budget.status !== 'DRAFT')
            throw new auth_service_1.ValidationError('Hanya budget DRAFT yang bisa diubah');
        return await database_1.default.budget.update({ where: { id }, data });
    }
    async deleteBudget(id, userId) {
        const budget = await database_1.default.budget.findUnique({ where: { id } });
        if (!budget)
            throw new auth_service_1.ValidationError('Budget tidak ditemukan');
        if (budget.status !== 'DRAFT')
            throw new auth_service_1.ValidationError('Hanya budget DRAFT yang bisa dihapus');
        await database_1.default.budget.delete({ where: { id } });
        return { message: 'Budget berhasil dihapus' };
    }
    async approveBudget(id, userId) {
        const budget = await database_1.default.budget.findUnique({ where: { id } });
        if (!budget)
            throw new auth_service_1.ValidationError('Budget tidak ditemukan');
        if (budget.status !== 'DRAFT')
            throw new auth_service_1.ValidationError('Budget sudah disetujui');
        return await database_1.default.budget.update({
            where: { id },
            data: {
                status: 'APPROVED',
                disetujuiOleh: userId,
                tanggalDisetujui: new Date(),
            },
        });
    }
    async activateBudget(id, userId) {
        const budget = await database_1.default.budget.findUnique({ where: { id } });
        if (!budget)
            throw new auth_service_1.ValidationError('Budget tidak ditemukan');
        if (budget.status !== 'APPROVED')
            throw new auth_service_1.ValidationError('Budget harus disetujui dulu');
        return await database_1.default.budget.update({ where: { id }, data: { status: 'AKTIF' } });
    }
    async closeBudget(id, userId) {
        return await database_1.default.budget.update({ where: { id }, data: { status: 'CLOSED' } });
    }
    async getBudgets(filters, userId) {
        const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
        if (!user)
            throw new auth_service_1.AuthenticationError('User tidak ditemukan');
        const where = {
            perusahaanId: user.role === 'SUPERADMIN' ? filters.perusahaanId : user.perusahaanId,
            ...(filters.tahun && { tahun: filters.tahun }),
            ...(filters.status && { status: filters.status }),
            ...(filters.tipe && { tipe: filters.tipe }),
        };
        return await database_1.default.budget.findMany({
            where,
            include: { detail: { include: { akun: true } } },
            orderBy: { tahun: 'desc' },
        });
    }
    async getBudgetById(id, userId) {
        const budget = await database_1.default.budget.findUnique({
            where: { id },
            include: {
                detail: { include: { akun: true } },
                revisi: true,
            },
        });
        if (!budget)
            throw new auth_service_1.ValidationError('Budget tidak ditemukan');
        return budget;
    }
    async addBudgetDetail(budgetId, data, userId) {
        const budget = await database_1.default.budget.findUnique({ where: { id: budgetId } });
        if (!budget)
            throw new auth_service_1.ValidationError('Budget tidak ditemukan');
        if (budget.status !== 'DRAFT')
            throw new auth_service_1.ValidationError('Hanya budget DRAFT yang bisa ditambah detail');
        const detail = await database_1.default.budgetDetail.create({
            data: {
                budgetId,
                akunId: data.akunId,
                bulan: data.bulan,
                periode: new Date(data.periode),
                jumlahBudget: data.jumlahBudget,
                keterangan: data.keterangan,
            },
        });
        // Update total budget
        await this.recalculateBudgetTotal(budgetId);
        return detail;
    }
    async updateBudgetDetail(budgetId, detailId, data, userId) {
        const budget = await database_1.default.budget.findUnique({ where: { id: budgetId } });
        if (!budget)
            throw new auth_service_1.ValidationError('Budget tidak ditemukan');
        if (budget.status !== 'DRAFT')
            throw new auth_service_1.ValidationError('Hanya budget DRAFT yang bisa diubah');
        const detail = await database_1.default.budgetDetail.update({
            where: { id: detailId },
            data,
        });
        await this.recalculateBudgetTotal(budgetId);
        return detail;
    }
    async deleteBudgetDetail(budgetId, detailId, userId) {
        const budget = await database_1.default.budget.findUnique({ where: { id: budgetId } });
        if (!budget)
            throw new auth_service_1.ValidationError('Budget tidak ditemukan');
        if (budget.status !== 'DRAFT')
            throw new auth_service_1.ValidationError('Hanya budget DRAFT yang bisa dihapus detail');
        await database_1.default.budgetDetail.delete({ where: { id: detailId } });
        await this.recalculateBudgetTotal(budgetId);
        return { message: 'Budget detail berhasil dihapus' };
    }
    async createBudgetRevision(budgetId, data, userId) {
        const budget = await database_1.default.budget.findUnique({ where: { id: budgetId }, include: { revisi: true } });
        if (!budget)
            throw new auth_service_1.ValidationError('Budget tidak ditemukan');
        const versi = (budget.revisi.length || 0) + 1;
        return await database_1.default.budgetRevisi.create({
            data: {
                budgetId,
                versi,
                tanggalRevisi: new Date(),
                alasanRevisi: data.alasanRevisi,
                jumlahSebelum: data.jumlahSebelum,
                jumlahSesudah: data.jumlahSesudah,
                direvisiOleh: userId,
                catatan: data.catatan,
            },
        });
    }
    async getBudgetVsActual(budgetId, bulan) {
        const budget = await database_1.default.budget.findUnique({
            where: { id: budgetId },
            include: { detail: { include: { akun: true } } },
        });
        if (!budget)
            throw new auth_service_1.ValidationError('Budget tidak ditemukan');
        const details = bulan ? budget.detail.filter((d) => d.bulan === bulan) : budget.detail;
        const result = await Promise.all(details.map(async (d) => {
            // Get actual from jurnal
            const actual = await database_1.default.jurnalDetail.aggregate({
                where: {
                    akunId: d.akunId,
                    jurnal: {
                        tanggal: {
                            gte: new Date(budget.tahun, d.bulan - 1, 1),
                            lte: new Date(budget.tahun, d.bulan, 0),
                        },
                    },
                },
                _sum: {
                    debit: true,
                    kredit: true,
                },
            });
            const actualAmount = (actual._sum.debit?.toNumber() || 0) - (actual._sum.kredit?.toNumber() || 0);
            const variance = d.jumlahBudget.toNumber() - actualAmount;
            const variancePercentage = d.jumlahBudget.toNumber() ? (variance / d.jumlahBudget.toNumber()) * 100 : 0;
            return {
                akunId: d.akunId,
                namaAkun: d.akun.namaAkun,
                bulan: d.bulan,
                budget: d.jumlahBudget.toNumber(),
                actual: actualAmount,
                variance,
                variancePercentage,
            };
        }));
        return {
            budget,
            analysis: result,
            summary: {
                totalBudget: result.reduce((sum, r) => sum + r.budget, 0),
                totalActual: result.reduce((sum, r) => sum + r.actual, 0),
                totalVariance: result.reduce((sum, r) => sum + r.variance, 0),
            },
        };
    }
    async recalculateBudgetTotal(budgetId) {
        const details = await database_1.default.budgetDetail.findMany({ where: { budgetId } });
        const total = details.reduce((sum, d) => sum + d.jumlahBudget.toNumber(), 0);
        await database_1.default.budget.update({ where: { id: budgetId }, data: { totalBudget: total } });
    }
}
exports.BudgetService = BudgetService;
exports.budgetService = new BudgetService();

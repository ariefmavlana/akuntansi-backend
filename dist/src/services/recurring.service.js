"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recurringService = exports.RecurringService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const auth_service_1 = require("./auth.service");
const client_1 = require("@prisma/client");
class RecurringService {
    // Create recurring transaction
    async createRecurring(data, userId) {
        const user = await database_1.default.pengguna.findUnique({ where: { id: userId } });
        if (!user)
            throw new auth_service_1.AuthenticationError('User tidak ditemukan');
        // Validate balance in template details
        const totalDebit = data.template.details.reduce((sum, d) => sum + d.debit, 0);
        const totalKredit = data.template.details.reduce((sum, d) => sum + d.kredit, 0);
        if (Math.abs(totalDebit - totalKredit) > 0.01) {
            throw new auth_service_1.ValidationError('Total debit harus sama dengan total kredit');
        }
        // Generate kode
        const count = await database_1.default.transaksiRekuren.count({
            where: { perusahaanId: data.perusahaanId },
        });
        const now = new Date();
        const kode = `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;
        // Calculate first execution date
        const tanggalExekusiBerikutnya = this.calculateNextRun(new Date(data.tanggalMulai), data.frekuensi, data.intervalHari);
        const recurring = await database_1.default.transaksiRekuren.create({
            data: {
                perusahaanId: data.perusahaanId,
                kode,
                nama: data.nama,
                catatan: data.deskripsi,
                tipe: data.tipeTransaksi,
                frekuensi: data.frekuensi,
                intervalHari: data.intervalHari,
                tanggalMulai: new Date(data.tanggalMulai),
                tanggalAkhir: data.tanggalBerakhir ? new Date(data.tanggalBerakhir) : null,
                templateTransaksi: data.template,
                tanggalExekusiBerikutnya,
                isAktif: data.isAktif ?? true,
            },
        });
        logger_1.default.info(`Recurring transaction created: ${recurring.id} (${kode})`);
        return recurring;
    }
    // Update recurring transaction
    async updateRecurring(id, data, userId) {
        const existing = await database_1.default.transaksiRekuren.findUnique({ where: { id } });
        if (!existing)
            throw new auth_service_1.ValidationError('Transaksi rekuren tidak ditemukan');
        // Validate balance if template is being updated
        if (data.template?.details) {
            const totalDebit = data.template.details.reduce((sum, d) => sum + d.debit, 0);
            const totalKredit = data.template.details.reduce((sum, d) => sum + d.kredit, 0);
            if (Math.abs(totalDebit - totalKredit) > 0.01) {
                throw new auth_service_1.ValidationError('Total debit harus sama dengan total kredit');
            }
        }
        // Recalculate next run if frequency or start date changes
        let tanggalExekusiBerikutnya = existing.tanggalExekusiBerikutnya;
        if (data.frekuensi || data.tanggalMulai || data.intervalHari !== undefined) {
            const frequency = data.frekuensi || existing.frekuensi;
            const startDate = data.tanggalMulai ? new Date(data.tanggalMulai) : existing.tanggalMulai;
            const interval = data.intervalHari ?? existing.intervalHari;
            tanggalExekusiBerikutnya = this.calculateNextRun(startDate, frequency, interval);
        }
        const updated = await database_1.default.transaksiRekuren.update({
            where: { id },
            data: {
                nama: data.nama,
                catatan: data.deskripsi,
                frekuensi: data.frekuensi,
                intervalHari: data.intervalHari,
                tanggalMulai: data.tanggalMulai ? new Date(data.tanggalMulai) : undefined,
                tanggalAkhir: data.tanggalBerakhir ? new Date(data.tanggalBerakhir) : undefined,
                templateTransaksi: data.template ? data.template : undefined,
                tanggalExekusiBerikutnya,
                isAktif: data.isAktif,
            },
        });
        logger_1.default.info(`Recurring transaction updated: ${id}`);
        return updated;
    }
    // Get all recurring transactions
    async getRecurringTransactions(filters) {
        const where = { perusahaanId: filters.perusahaanId };
        if (filters.tipeTransaksi)
            where.tipe = filters.tipeTransaksi;
        if (filters.frekuensi)
            where.frekuensi = filters.frekuensi;
        if (filters.isAktif !== undefined)
            where.isAktif = filters.isAktif === 'true';
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            database_1.default.transaksiRekuren.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            database_1.default.transaksiRekuren.count({ where }),
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
    // Get single recurring transaction
    async getRecurringTransaction(id) {
        const recurring = await database_1.default.transaksiRekuren.findUnique({
            where: { id },
            include: {
                riwayat: {
                    orderBy: { tanggalDijadwalkan: 'desc' },
                    take: 10,
                },
            },
        });
        if (!recurring)
            throw new auth_service_1.ValidationError('Transaksi rekuren tidak ditemukan');
        return recurring;
    }
    // Execute recurring transaction manually
    async executeRecurring(id, userId) {
        const recurring = await database_1.default.transaksiRekuren.findUnique({ where: { id } });
        if (!recurring)
            throw new auth_service_1.ValidationError('Transaksi rekuren tidak ditemukan');
        if (!recurring.isAktif)
            throw new auth_service_1.ValidationError('Transaksi rekuren tidak aktif');
        return await this.executeTransaction(recurring, userId);
    }
    // Get recurring transaction history
    async getRecurringHistory(id, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            database_1.default.riwayatTransaksiRekuren.findMany({
                where: { rekurenId: id },
                skip,
                take: limit,
                orderBy: { tanggalDijadwalkan: 'desc' },
                include: {
                    transaksi: {
                        select: {
                            nomorTransaksi: true,
                            tanggal: true,
                            total: true,
                            isPosted: true,
                        },
                    },
                },
            }),
            database_1.default.riwayatTransaksiRekuren.count({ where: { rekurenId: id } }),
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
    // Delete recurring transaction
    async deleteRecurring(id) {
        const recurring = await database_1.default.transaksiRekuren.findUnique({ where: { id } });
        if (!recurring)
            throw new auth_service_1.ValidationError('Transaksi rekuren tidak ditemukan');
        await database_1.default.transaksiRekuren.delete({ where: { id } });
        logger_1.default.info(`Recurring transaction deleted: ${id}`);
        return { message: 'Transaksi rekuren berhasil dihapus' };
    }
    // Process due recurring transactions (called by cron)
    async processDueRecurring() {
        const now = new Date();
        const dueRecurring = await database_1.default.transaksiRekuren.findMany({
            where: {
                isAktif: true,
                tanggalExekusiBerikutnya: { lte: now },
                OR: [
                    { tanggalAkhir: null },
                    { tanggalAkhir: { gte: now } },
                ],
            },
        });
        logger_1.default.info(`Processing ${dueRecurring.length} due recurring transactions`);
        for (const recurring of dueRecurring) {
            try {
                await this.executeTransaction(recurring, 'system');
                // Calculate next run
                const nextRun = this.calculateNextRun(recurring.tanggalExekusiBerikutnya, recurring.frekuensi, recurring.intervalHari);
                await database_1.default.transaksiRekuren.update({
                    where: { id: recurring.id },
                    data: {
                        tanggalExekusiBerikutnya: nextRun,
                        jumlahEksekusi: { increment: 1 },
                        jumlahBerhasil: { increment: 1 },
                    },
                });
            }
            catch (error) {
                logger_1.default.error(`Failed to execute recurring ${recurring.id}:`, error);
                // Log failed execution
                await database_1.default.riwayatTransaksiRekuren.create({
                    data: {
                        rekurenId: recurring.id,
                        tanggalDijadwalkan: recurring.tanggalExekusiBerikutnya,
                        tanggalDiproses: now,
                        status: client_1.StatusRekuren.FAILED,
                        errorMessage: error.message,
                    },
                });
                await database_1.default.transaksiRekuren.update({
                    where: { id: recurring.id },
                    data: {
                        jumlahEksekusi: { increment: 1 },
                        jumlahGagal: { increment: 1 },
                    },
                });
            }
        }
    }
    // Private: Execute a single recurring transaction
    async executeTransaction(recurring, userId) {
        const template = recurring.templateTransaksi;
        const now = new Date();
        // Generate transaction number
        const count = await database_1.default.transaksi.count({
            where: { perusahaanId: recurring.perusahaanId },
        });
        const nomorTransaksi = `REC/${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}/${String(count + 1).padStart(4, '0')}`;
        // Calculate total
        const total = template.details.reduce((sum, d) => sum + (d.debit || d.kredit), 0);
        // Create transaction
        const transaksi = await database_1.default.transaksi.create({
            data: {
                perusahaanId: recurring.perusahaanId,
                penggunaId: userId === 'system' ? recurring.perusahaanId : userId, // Fallback for system
                nomorTransaksi,
                tanggal: now,
                tipe: recurring.tipe,
                mataUangId: template.mataUangId,
                pelangganId: template.pelangganId,
                pemasokId: template.pemasokId,
                referensi: template.referensi || `Recurring: ${recurring.nama}`,
                deskripsi: recurring.catatan,
                total,
                costCenterId: template.costCenterId,
                profitCenterId: template.profitCenterId,
                statusPembayaran: 'BELUM_DIBAYAR',
                detail: {
                    create: template.details.map((d, idx) => ({
                        urutan: idx + 1,
                        akunId: d.akunId,
                        deskripsi: d.deskripsi,
                        kuantitas: 1,
                        hargaSatuan: d.debit || d.kredit,
                        debit: d.debit || 0,
                        kredit: d.kredit || 0,
                    })),
                },
            },
        });
        // Auto-post if enabled
        if (recurring.autoPosting) {
            await database_1.default.transaksi.update({
                where: { id: transaksi.id },
                data: {
                    isPosted: true,
                    postedAt: now,
                    postedBy: userId,
                },
            });
        }
        // Log history
        await database_1.default.riwayatTransaksiRekuren.create({
            data: {
                rekurenId: recurring.id,
                transaksiId: transaksi.id,
                tanggalDijadwalkan: recurring.tanggalExekusiBerikutnya,
                tanggalDiproses: now,
                status: client_1.StatusRekuren.SUCCESS,
                dataTransaksi: {
                    nomorTransaksi: transaksi.nomorTransaksi,
                    total: transaksi.total.toString(),
                    tipe: transaksi.tipe,
                },
            },
        });
        logger_1.default.info(`Recurring transaction executed: ${recurring.id} -> ${transaksi.id}`);
        return transaksi;
    }
    // Private: Calculate next run date
    calculateNextRun(from, frequency, intervalHari) {
        const next = new Date(from);
        switch (frequency) {
            case client_1.FrekuensiRekuren.HARIAN:
                next.setDate(next.getDate() + 1);
                break;
            case client_1.FrekuensiRekuren.MINGGUAN:
                next.setDate(next.getDate() + 7);
                break;
            case client_1.FrekuensiRekuren.BULANAN:
                next.setMonth(next.getMonth() + 1);
                break;
            case client_1.FrekuensiRekuren.KUARTALAN:
                next.setMonth(next.getMonth() + 3);
                break;
            case client_1.FrekuensiRekuren.TAHUNAN:
                next.setFullYear(next.getFullYear() + 1);
                break;
            case client_1.FrekuensiRekuren.CUSTOM:
                if (intervalHari) {
                    next.setDate(next.getDate() + intervalHari);
                }
                else {
                    next.setDate(next.getDate() + 1); // Default to daily
                }
                break;
        }
        return next;
    }
}
exports.RecurringService = RecurringService;
exports.recurringService = new RecurringService();

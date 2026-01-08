"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.payrollService = exports.PayrollService = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
const auth_service_1 = require("./auth.service");
const journal_service_1 = require("./journal.service");
const pph21_1 = require("../utils/pph21");
/**
 * Payroll Service
 * Handles payroll processing
 */
class PayrollService {
    /**
     * Create payroll (manual)
     */
    async createPayroll(data) {
        try {
            // Check if payroll already exists for period
            const existing = await database_1.default.penggajian.findUnique({
                where: {
                    karyawanId_periode: {
                        karyawanId: data.karyawanId,
                        periode: data.periode,
                    }
                }
            });
            if (existing)
                throw new auth_service_1.ValidationError('Slip gaji untuk periode ini sudah ada');
            // Fetch employee for tax details if needed
            const employee = await database_1.default.karyawan.findUnique({
                where: { id: data.karyawanId }
            });
            if (!employee)
                throw new auth_service_1.ValidationError('Karyawan tidak ditemukan');
            // Calculate totals
            const grossIncome = data.gajiPokok + data.tunjangan + data.lembur + data.bonus;
            let potonganPph21 = data.potonganPph21;
            if (potonganPph21 === 0) {
                const pph21Result = pph21_1.PPh21Utils.calculate(grossIncome, {
                    statusPtkp: employee.statusPtkp || 'TK/0',
                    hasNpwp: !!employee.npwp
                });
                potonganPph21 = pph21Result.pph21Bulanan;
            }
            const totalPenghasilan = grossIncome;
            const totalPotongan = data.potonganBpjs + potonganPph21 + data.potonganLainnya;
            const netto = totalPenghasilan - totalPotongan;
            const payroll = await database_1.default.penggajian.create({
                data: {
                    ...data,
                    potonganPph21, // Use calculated or provided
                    tanggalBayar: new Date(data.tanggalBayar),
                    totalPenghasilan,
                    totalPotongan,
                    netto,
                    sudahDibayar: false,
                    sudahDijurnal: false,
                }
            });
            logger_1.default.info(`Payroll created: ${payroll.id}`);
            return payroll;
        }
        catch (error) {
            logger_1.default.error('Create payroll error:', error);
            throw error;
        }
    }
    /**
     * Generate payroll (batch)
     */
    async generatePayroll(data) {
        try {
            // Get active employees
            const employees = await database_1.default.karyawan.findMany({
                where: {
                    perusahaanId: data.perusahaanId,
                    status: 'AKTIF',
                }
            });
            let count = 0;
            const errors = [];
            for (const emp of employees) {
                try {
                    // Check existence
                    const exists = await database_1.default.penggajian.findUnique({
                        where: {
                            karyawanId_periode: {
                                karyawanId: emp.id,
                                periode: data.periode
                            }
                        }
                    });
                    if (exists)
                        continue;
                    // Calculate basic defaults
                    const gajiPokok = Number(emp.gajiPokok);
                    const tunjangan = 0; // Default (enhance later to fetch from components)
                    const lembur = 0;
                    const bonus = 0;
                    const grossIncome = gajiPokok + tunjangan + lembur + bonus;
                    // Calculate PPh21
                    const pph21Result = pph21_1.PPh21Utils.calculate(grossIncome, {
                        statusPtkp: emp.statusPtkp || 'TK/0',
                        hasNpwp: !!emp.npwp // basic check
                    });
                    const potonganPph21 = pph21Result.pph21Bulanan;
                    const totalPenghasilan = grossIncome;
                    const totalPotongan = potonganPph21; // + BPJS later
                    const netto = totalPenghasilan - totalPotongan;
                    await database_1.default.penggajian.create({
                        data: {
                            karyawanId: emp.id,
                            periode: data.periode,
                            tanggalBayar: new Date(data.tanggalBayar),
                            gajiPokok,
                            tunjangan,
                            lembur,
                            bonus,
                            potonganPph21,
                            potonganBpjs: 0, // Implement BPJS calc if needed
                            potonganLainnya: 0,
                            totalPenghasilan,
                            totalPotongan,
                            netto,
                            sudahDibayar: false,
                            sudahDijurnal: false,
                        }
                    });
                    count++;
                }
                catch (e) {
                    logger_1.default.error(`Failed to generate payroll for employee ${emp.id}:`, e);
                    errors.push(emp.id);
                }
            }
            logger_1.default.info(`Generated ${count} payroll records for period ${data.periode}`);
            return { count };
        }
        catch (error) {
            logger_1.default.error('Generate payroll error:', error);
            throw error;
        }
    }
    /**
     * List payrolls
     */
    async listPayrolls(query) {
        try {
            const { page = 1, limit = 20, karyawanId, perusahaanId, periode, status } = query;
            const skip = (page - 1) * limit;
            const where = {};
            if (karyawanId)
                where.karyawanId = karyawanId;
            if (periode)
                where.periode = periode;
            if (status === 'PAID')
                where.sudahDibayar = true;
            if (status === 'UNPAID')
                where.sudahDibayar = false;
            if (perusahaanId) {
                where.karyawan = { perusahaanId };
            }
            const [data, total] = await Promise.all([
                database_1.default.penggajian.findMany({
                    where,
                    include: { karyawan: true },
                    skip,
                    take: limit,
                    orderBy: { periode: 'desc' },
                }),
                database_1.default.penggajian.count({ where }),
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
            logger_1.default.error('List payrolls error:', error);
            throw error;
        }
    }
    /**
     * Pay payroll & Create Auto-Journal
     */
    async payPayroll(id, data, requestingUserId) {
        try {
            const payroll = await database_1.default.penggajian.findUnique({
                where: { id },
                include: { karyawan: true }
            });
            if (!payroll)
                throw new auth_service_1.ValidationError('Data penggajian tidak ditemukan');
            if (payroll.sudahDibayar)
                throw new auth_service_1.ValidationError('Gaji sudah dibayar');
            const perusahaanId = payroll.karyawan.perusahaanId;
            // 1. Resolve Accounts
            // Credit Account (Kas/Bank)
            const cashAccount = await database_1.default.chartOfAccounts.findUnique({
                where: { id: data.akunKasId }
            });
            if (!cashAccount)
                throw new auth_service_1.ValidationError('Akun kas/bank tidak ditemukan');
            // Debit Account (Beban Gaji)
            let expenseAccount = null;
            if (data.akunBebanId) {
                expenseAccount = await database_1.default.chartOfAccounts.findUnique({ where: { id: data.akunBebanId } });
            }
            else {
                // Try to find default Beban Gaji
                expenseAccount = await database_1.default.chartOfAccounts.findFirst({
                    where: {
                        perusahaanId,
                        tipe: 'BEBAN',
                        namaAkun: { contains: 'Gaji', mode: 'insensitive' }
                    }
                });
            }
            if (!expenseAccount)
                throw new auth_service_1.ValidationError('Akun beban gaji tidak ditemukan. Harap tentukan akun beban.');
            // 1.5 Get Open Period
            const payrollDate = new Date(payroll.tanggalBayar);
            const periodeAkuntansi = await database_1.default.periodeAkuntansi.findFirst({
                where: {
                    perusahaanId,
                    status: 'TERBUKA',
                    tanggalMulai: { lte: payrollDate },
                    tanggalAkhir: { gte: payrollDate }
                }
            });
            if (!periodeAkuntansi) {
                throw new auth_service_1.ValidationError('Periode akuntansi tertutup atau tidak ditemukan untuk tanggal pembayaran ini');
            }
            // 2. Create Journal
            const journal = await journal_service_1.journalService.createJournal({
                perusahaanId,
                periodeId: periodeAkuntansi.id, // Pass periodeId
                // tipe: 'JURNAL_UMUM', // Use default or let service handle if mapped
                tanggal: new Date(),
                deskripsi: `Pembayaran Gaji ${payroll.karyawan.nama} Periode ${payroll.periode}`,
                detail: [
                    {
                        urutan: 1,
                        akunId: expenseAccount.id,
                        deskripsi: `Beban Gaji ${payroll.karyawan.nama}`,
                        debit: Number(payroll.netto),
                        kredit: 0
                    },
                    {
                        urutan: 2,
                        akunId: cashAccount.id,
                        deskripsi: `Pembayaran Gaji ${payroll.karyawan.nama}`,
                        debit: 0,
                        kredit: Number(payroll.netto)
                    }
                ]
            }, requestingUserId);
            // 3. Update Payroll Status
            const updated = await database_1.default.penggajian.update({
                where: { id },
                data: {
                    sudahDibayar: true,
                    sudahDijurnal: true,
                    // Store journal ID? Schema doesn't have journalId on Penggajian. Maybe catatn?
                }
            });
            logger_1.default.info(`Payroll paid and journaled: ${updated.id} -> Journal ${journal.id}`);
            return updated;
        }
        catch (error) {
            logger_1.default.error('Pay payroll error:', error);
            throw error;
        }
    }
    /**
     * Update payroll
     */
    async updatePayroll(id, data) {
        try {
            const payroll = await database_1.default.penggajian.findUnique({ where: { id } });
            if (!payroll)
                throw new auth_service_1.ValidationError('Data gaji tidak ditemukan');
            if (payroll.sudahDibayar)
                throw new auth_service_1.ValidationError('Tidak dapat mengubah gaji yang sudah dibayar');
            // Recalculate if salary components changed
            const { gajiPokok, tunjangan, lembur, bonus, potonganBpjs, potonganPph21, potonganLainnya } = payroll;
            const newGajiPokok = data.gajiPokok ?? Number(gajiPokok);
            const newTunjangan = data.tunjangan ?? Number(tunjangan);
            const newLembur = data.lembur ?? Number(lembur);
            const newBonus = data.bonus ?? Number(bonus);
            const newPotBpjs = data.potonganBpjs ?? Number(potonganBpjs);
            const newPotPph = data.potonganPph21 ?? Number(potonganPph21);
            const newPotLain = data.potonganLainnya ?? Number(potonganLainnya);
            const totalPenghasilan = newGajiPokok + newTunjangan + newLembur + newBonus;
            const totalPotongan = newPotBpjs + newPotPph + newPotLain;
            const netto = totalPenghasilan - totalPotongan;
            const updated = await database_1.default.penggajian.update({
                where: { id },
                data: {
                    ...data,
                    ...(data.tanggalBayar && { tanggalBayar: new Date(data.tanggalBayar) }),
                    totalPenghasilan,
                    totalPotongan,
                    netto
                }
            });
            logger_1.default.info(`Payroll updated: ${updated.id}`);
            return updated;
        }
        catch (error) {
            logger_1.default.error('Update payroll error:', error);
            throw error;
        }
    }
    // deletePayroll, getPayrollById can be added similarly
    async getPayrollById(id) {
        const payroll = await database_1.default.penggajian.findUnique({
            where: { id },
            include: { karyawan: true }
        });
        return payroll;
    }
    async deletePayroll(id) {
        const payroll = await database_1.default.penggajian.findUnique({ where: { id } });
        if (!payroll)
            throw new auth_service_1.ValidationError('Data tidak ditemukan');
        if (payroll.sudahDibayar)
            throw new auth_service_1.ValidationError('Tidak dapat menghapus gaji yang sudah dibayar');
        return database_1.default.penggajian.delete({ where: { id } });
    }
}
exports.PayrollService = PayrollService;
exports.payrollService = new PayrollService();

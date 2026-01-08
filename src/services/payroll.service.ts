import prisma from '@/config/database';
import logger from '@/utils/logger';
import { Penggajian, Karyawan, Prisma } from '@prisma/client';
import {
    CreatePayrollInput,
    GeneratePayrollInput,
    UpdatePayrollInput,
    ListPayrollsInput,
    PayPayrollInput,
} from '@/validators/payroll.validator';
import { ValidationError } from './auth.service';
import { journalService } from './journal.service';
import { PPh21Utils } from '@/utils/pph21';

/**
 * Payroll Service
 * Handles payroll processing
 */
export class PayrollService {
    /**
     * Create payroll (manual)
     */
    async createPayroll(data: CreatePayrollInput): Promise<Penggajian> {
        try {
            // Check if payroll already exists for period
            const existing = await prisma.penggajian.findUnique({
                where: {
                    karyawanId_periode: {
                        karyawanId: data.karyawanId,
                        periode: data.periode,
                    }
                }
            });

            if (existing) throw new ValidationError('Slip gaji untuk periode ini sudah ada');

            // Fetch employee for tax details if needed
            const employee = await prisma.karyawan.findUnique({
                where: { id: data.karyawanId }
            });

            if (!employee) throw new ValidationError('Karyawan tidak ditemukan');

            // Calculate totals
            const grossIncome = data.gajiPokok + data.tunjangan + data.lembur + data.bonus;

            let potonganPph21 = data.potonganPph21;
            if (potonganPph21 === 0) {
                const pph21Result = PPh21Utils.calculate(grossIncome, {
                    statusPtkp: employee.statusPtkp || 'TK/0',
                    hasNpwp: !!employee.npwp
                });
                potonganPph21 = pph21Result.pph21Bulanan;
            }

            const totalPenghasilan = grossIncome;
            const totalPotongan = data.potonganBpjs + potonganPph21 + data.potonganLainnya;
            const netto = totalPenghasilan - totalPotongan;

            const payroll = await prisma.penggajian.create({
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

            logger.info(`Payroll created: ${payroll.id}`);
            return payroll;
        } catch (error) {
            logger.error('Create payroll error:', error);
            throw error;
        }
    }

    /**
     * Generate payroll (batch)
     */
    async generatePayroll(data: GeneratePayrollInput): Promise<{ count: number }> {
        try {
            // Get active employees
            const employees = await prisma.karyawan.findMany({
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
                    const exists = await prisma.penggajian.findUnique({
                        where: {
                            karyawanId_periode: {
                                karyawanId: emp.id,
                                periode: data.periode
                            }
                        }
                    });

                    if (exists) continue;

                    // Calculate basic defaults
                    const gajiPokok = Number(emp.gajiPokok);
                    const tunjangan = 0; // Default (enhance later to fetch from components)
                    const lembur = 0;
                    const bonus = 0;

                    const grossIncome = gajiPokok + tunjangan + lembur + bonus;

                    // Calculate PPh21
                    const pph21Result = PPh21Utils.calculate(grossIncome, {
                        statusPtkp: emp.statusPtkp || 'TK/0',
                        hasNpwp: !!emp.npwp // basic check
                    });

                    const potonganPph21 = pph21Result.pph21Bulanan;
                    const totalPenghasilan = grossIncome;
                    const totalPotongan = potonganPph21; // + BPJS later
                    const netto = totalPenghasilan - totalPotongan;

                    await prisma.penggajian.create({
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
                } catch (e) {
                    logger.error(`Failed to generate payroll for employee ${emp.id}:`, e);
                    errors.push(emp.id);
                }
            }

            logger.info(`Generated ${count} payroll records for period ${data.periode}`);
            return { count };
        } catch (error) {
            logger.error('Generate payroll error:', error);
            throw error;
        }
    }

    /**
     * List payrolls
     */
    async listPayrolls(query: ListPayrollsInput): Promise<{
        data: (Penggajian & { karyawan: Karyawan })[];
        meta: { total: number; page: number; limit: number; totalPages: number }
    }> {
        try {
            const { page = 1, limit = 20, karyawanId, perusahaanId, periode, status } = query;
            const skip = (page - 1) * limit;

            const where: Prisma.PenggajianWhereInput = {};
            if (karyawanId) where.karyawanId = karyawanId;
            if (periode) where.periode = periode;
            if (status === 'PAID') where.sudahDibayar = true;
            if (status === 'UNPAID') where.sudahDibayar = false;

            if (perusahaanId) {
                where.karyawan = { perusahaanId };
            }

            const [data, total] = await Promise.all([
                prisma.penggajian.findMany({
                    where,
                    include: { karyawan: true },
                    skip,
                    take: limit,
                    orderBy: { periode: 'desc' },
                }),
                prisma.penggajian.count({ where }),
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
            logger.error('List payrolls error:', error);
            throw error;
        }
    }

    /**
     * Pay payroll & Create Auto-Journal
     */
    async payPayroll(id: string, data: PayPayrollInput['body'], requestingUserId: string): Promise<Penggajian> {
        try {
            const payroll = await prisma.penggajian.findUnique({
                where: { id },
                include: { karyawan: true }
            });

            if (!payroll) throw new ValidationError('Data penggajian tidak ditemukan');
            if (payroll.sudahDibayar) throw new ValidationError('Gaji sudah dibayar');

            const perusahaanId = payroll.karyawan.perusahaanId;

            // 1. Resolve Accounts
            // Credit Account (Kas/Bank)
            const cashAccount = await prisma.chartOfAccounts.findUnique({
                where: { id: data.akunKasId }
            });
            if (!cashAccount) throw new ValidationError('Akun kas/bank tidak ditemukan');

            // Debit Account (Beban Gaji)
            let expenseAccount: any = null;
            if (data.akunBebanId) {
                expenseAccount = await prisma.chartOfAccounts.findUnique({ where: { id: data.akunBebanId } });
            } else {
                // Try to find default Beban Gaji
                expenseAccount = await prisma.chartOfAccounts.findFirst({
                    where: {
                        perusahaanId,
                        tipe: 'BEBAN',
                        namaAkun: { contains: 'Gaji', mode: 'insensitive' }
                    }
                });
            }

            if (!expenseAccount) throw new ValidationError('Akun beban gaji tidak ditemukan. Harap tentukan akun beban.');

            // 1.5 Get Open Period
            const payrollDate = new Date(payroll.tanggalBayar);
            const periodeAkuntansi = await prisma.periodeAkuntansi.findFirst({
                where: {
                    perusahaanId,
                    status: 'TERBUKA',
                    tanggalMulai: { lte: payrollDate },
                    tanggalAkhir: { gte: payrollDate }
                }
            });

            if (!periodeAkuntansi) {
                throw new ValidationError('Periode akuntansi tertutup atau tidak ditemukan untuk tanggal pembayaran ini');
            }

            // 2. Create Journal
            const journal = await journalService.createJournal({
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
            const updated = await prisma.penggajian.update({
                where: { id },
                data: {
                    sudahDibayar: true,
                    sudahDijurnal: true,
                    // Store journal ID? Schema doesn't have journalId on Penggajian. Maybe catatn?
                }
            });

            logger.info(`Payroll paid and journaled: ${updated.id} -> Journal ${journal.id}`);
            return updated;

        } catch (error) {
            logger.error('Pay payroll error:', error);
            throw error;
        }
    }

    /**
     * Update payroll
     */
    async updatePayroll(id: string, data: UpdatePayrollInput['body']): Promise<Penggajian> {
        try {
            const payroll = await prisma.penggajian.findUnique({ where: { id } });
            if (!payroll) throw new ValidationError('Data gaji tidak ditemukan');
            if (payroll.sudahDibayar) throw new ValidationError('Tidak dapat mengubah gaji yang sudah dibayar');

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

            const updated = await prisma.penggajian.update({
                where: { id },
                data: {
                    ...data,
                    ...(data.tanggalBayar && { tanggalBayar: new Date(data.tanggalBayar) }),
                    totalPenghasilan,
                    totalPotongan,
                    netto
                }
            });
            logger.info(`Payroll updated: ${updated.id}`);
            return updated;
        } catch (error) {
            logger.error('Update payroll error:', error);
            throw error;
        }
    }

    // deletePayroll, getPayrollById can be added similarly
    async getPayrollById(id: string): Promise<Penggajian | null> {
        const payroll = await prisma.penggajian.findUnique({
            where: { id },
            include: { karyawan: true }
        });
        return payroll;
    }

    async deletePayroll(id: string): Promise<Penggajian> {
        const payroll = await prisma.penggajian.findUnique({ where: { id } });
        if (!payroll) throw new ValidationError('Data tidak ditemukan');
        if (payroll.sudahDibayar) throw new ValidationError('Tidak dapat menghapus gaji yang sudah dibayar');

        return prisma.penggajian.delete({ where: { id } });
    }
}

export const payrollService = new PayrollService();

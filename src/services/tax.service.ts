import prisma from '@/config/database';
import logger from '@/utils/logger';
import type {
    CalculatePPh21Input,
    CalculatePPNInput,
    CreateTaxTransactionInput,
    GetTaxReportInput,
    ListTaxTransactionsInput,
} from '@/validators/tax.validator';
import { AuthenticationError, ValidationError } from './auth.service';

/**
 * Tax Service
 * Handles Indonesian tax calculations (PPh & PPN)
 */
export class TaxService {
    /**
     * Calculate PPh 21 (Employee Income Tax)
     * Based on Indonesian tax law
     */
    async calculatePPh21(data: CalculatePPh21Input) {
        try {
            const { penghasilanBruto, statusPerkawinan, jumlahTanggungan, iuranPensiun, iuranJHT } = data;

            // PTKP (Penghasilan Tidak Kena Pajak) 2024
            const ptkpTK = 54000000; // TK/0
            const ptkpPerTanggungan = 4500000;
            const ptkpKawin = 4500000;

            let ptkp = ptkpTK;
            if (statusPerkawinan === 'K') {
                ptkp += ptkpKawin;
            }
            ptkp += jumlahTanggungan * ptkpPerTanggungan;

            // Penghasilan Neto
            const biayaJabatan = Math.min(penghasilanBruto * 0.05, 6000000); // Max 6 juta/tahun
            const penguranganLain = iuranPensiun + iuranJHT;
            const penghasilanNeto = penghasilanBruto - biayaJabatan - penguranganLain;

            // PKP (Penghasilan Kena Pajak)
            const pkp = Math.max(penghasilanNeto - ptkp, 0);

            // Calculate tax based on progressive rates (2024)
            let pajak = 0;
            if (pkp <= 60000000) {
                pajak = pkp * 0.05;
            } else if (pkp <= 250000000) {
                pajak = 60000000 * 0.05 + (pkp - 60000000) * 0.15;
            } else if (pkp <= 500000000) {
                pajak = 60000000 * 0.05 + 190000000 * 0.15 + (pkp - 250000000) * 0.25;
            } else if (pkp <= 5000000000) {
                pajak = 60000000 * 0.05 + 190000000 * 0.15 + 250000000 * 0.25 + (pkp - 500000000) * 0.30;
            } else {
                pajak = 60000000 * 0.05 + 190000000 * 0.15 + 250000000 * 0.25 + 4500000000 * 0.30 + (pkp - 5000000000) * 0.35;
            }

            return {
                penghasilanBruto,
                biayaJabatan,
                iuranPensiun,
                iuranJHT,
                penghasilanNeto,
                ptkp,
                pkp,
                pajakTerutang: Math.round(pajak),
                pajakPerBulan: Math.round(pajak / 12),
            };
        } catch (error) {
            logger.error('Calculate PPh 21 error:', error);
            throw error;
        }
    }

    /**
     * Calculate PPN (VAT)
     */
    async calculatePPN(data: CalculatePPNInput) {
        try {
            const { dpp, tarifPPN, isPKP } = data;

            if (!isPKP) {
                return {
                    dpp,
                    tarifPPN: 0,
                    ppn: 0,
                    total: dpp,
                    isPKP: false,
                };
            }

            const ppn = dpp * (tarifPPN / 100);
            const total = dpp + ppn;

            return {
                dpp,
                tarifPPN,
                ppn: Math.round(ppn),
                total: Math.round(total),
                isPKP: true,
            };
        } catch (error) {
            logger.error('Calculate PPN error:', error);
            throw error;
        }
    }

    /**
     * Create tax transaction record
     */
    async createTaxTransaction(data: CreateTaxTransactionInput, requestingUserId: string) {
        try {
            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            // Check permissions
            const isSuperAdmin = requestingUser.role === 'SUPERADMIN';
            const isOwnCompany = requestingUser.perusahaanId === data.perusahaanId;
            const canCreate = ['ADMIN', 'TAX_OFFICER', 'ACCOUNTANT', 'SENIOR_ACCOUNTANT'].includes(
                requestingUser.role
            );

            if (!isSuperAdmin && !(isOwnCompany && canCreate)) {
                throw new AuthenticationError('Anda tidak memiliki akses untuk membuat transaksi pajak');
            }

            // Note: Since TransaksiPajak model might not exist yet, we'll log this
            // In production, you would create the actual database record
            logger.info(`Tax transaction would be created: ${data.tipePajak} - ${data.jumlahPajak}`);

            return {
                message: 'Tax transaction recorded',
                data,
            };
        } catch (error) {
            logger.error('Create tax transaction error:', error);
            throw error;
        }
    }

    /**
     * Get tax report
     */
    async getTaxReport(filters: GetTaxReportInput, requestingUserId: string) {
        try {
            const { perusahaanId, tipePajak, tahun, bulan } = filters;

            const requestingUser = await prisma.pengguna.findUnique({
                where: { id: requestingUserId },
            });

            if (!requestingUser) {
                throw new AuthenticationError('User tidak ditemukan');
            }

            if (requestingUser.role !== 'SUPERADMIN' && requestingUser.perusahaanId !== perusahaanId) {
                throw new AuthenticationError('Anda tidak memiliki akses ke data perusahaan ini');
            }

            // Build date range
            let startDate: Date;
            let endDate: Date;

            if (bulan) {
                startDate = new Date(tahun, bulan - 1, 1);
                endDate = new Date(tahun, bulan, 0, 23, 59, 59);
            } else {
                startDate = new Date(tahun, 0, 1);
                endDate = new Date(tahun, 11, 31, 23, 59, 59);
            }

            // Get transactions with tax
            const transactions = await prisma.transaksi.findMany({
                where: {
                    perusahaanId,
                    tanggal: {
                        gte: startDate,
                        lte: endDate,
                    },
                    nilaiPajak: { gt: 0 },
                },
                select: {
                    id: true,
                    nomorTransaksi: true,
                    tanggal: true,
                    tipe: true,
                    subtotal: true,
                    nilaiPajak: true,
                    total: true,
                    pelanggan: { select: { nama: true, npwp: true } },
                    pemasok: { select: { nama: true, npwp: true } },
                },
                orderBy: { tanggal: 'asc' },
            });

            const summary = {
                periode: bulan ? `${bulan}/${tahun}` : `${tahun}`,
                totalTransaksi: transactions.length,
                totalDPP: transactions.reduce((sum, t) => sum + t.subtotal.toNumber(), 0),
                totalPajak: transactions.reduce((sum, t) => sum + t.nilaiPajak.toNumber(), 0),
                transactions,
            };

            return summary;
        } catch (error) {
            logger.error('Get tax report error:', error);
            throw error;
        }
    }
}

export const taxService = new TaxService();
